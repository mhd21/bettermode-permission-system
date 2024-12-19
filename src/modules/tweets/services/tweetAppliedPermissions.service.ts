import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TweetPermission, TweetPermissionType } from '@prisma/client';
import { GroupsService } from 'src/modules/groups/services/groups.service';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { extractTweetId } from 'src/shared/utils/idHelpers';
import { TweetPermissionUpdatedEvent } from '../events/tweet-permissions-updated.event';

@Injectable()
export class TweetsAppliedPermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupService: GroupsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async updateTweetPermissions(tweetId: string) {
    const { id: tweetMainId, rootAuthorId } = extractTweetId(tweetId);
    const rootTweets = await this.findRootTweets(tweetId);
    let isPublicView = false;
    let isPublicEdit = false;

    if (rootTweets.editRoot === rootTweets.viewRoot) {
      const { id: rootTweetId, rootAuthorId: rootTweetAuthorId } =
        extractTweetId(rootTweets.editRoot);

      const rootTweet = await this.prisma.tweet.findFirstOrThrow({
        where: {
          id: rootTweetId,
          authorId: rootTweetAuthorId,
        },
      });

      isPublicView = rootTweet.isPublicView;
      isPublicEdit = rootTweet.isPublicEdit;
    } else {
      const { id: viewTweetMainId, rootAuthorId: viewAuthorId } =
        extractTweetId(rootTweets.viewRoot);
      const { id: editTweetMainId, rootAuthorId: editAuthorId } =
        extractTweetId(rootTweets.editRoot);

      const viewTweet = await this.prisma.tweet.findFirstOrThrow({
        where: {
          id: viewTweetMainId,
          authorId: viewAuthorId,
        },
      });

      const editTweet = await this.prisma.tweet.findFirstOrThrow({
        where: {
          id: editTweetMainId,
          authorId: editAuthorId,
        },
      });

      isPublicView = viewTweet.isPublicView;
      isPublicEdit = editTweet.isPublicEdit;
    }

    await this.prisma.tweet.update({
      select: {
        id: true,
        rootAuthorId: true,
      },
      where: {
        rootAuthorId_id: {
          id: tweetMainId,
          rootAuthorId,
        },
      },
      data: {
        isPublicView,
        isPublicEdit,
      },
    });

    if (!isPublicView || !isPublicEdit) {
      await this.updateTweetAppliedPermissions(
        tweetId,
        rootTweets.editRoot,
        rootTweets.viewRoot,
      );
    }

    const childTweets = await this.findChildTweetsInheritPermissions(tweetId);

    const childTweetsIds = new Set(
      childTweets.childViewTweets.concat(childTweets.childEditTweets),
    );

    await Promise.all(
      Array.from(childTweetsIds).map((childTweetId) =>
        this.eventEmitter.emitAsync(
          'tweet.permissions.updated',
          new TweetPermissionUpdatedEvent(childTweetId),
        ),
      ),
    );
  }

  async updateTweetAppliedPermissions(
    tweetId: string,
    editRoot: string,
    viewRoot: string,
  ) {
    const { id: tweetMainId, rootAuthorId } = extractTweetId(tweetId);

    const appliedViewPermissions = {};
    const appliedEditPermissions = {};

    if (editRoot === viewRoot) {
      const { id: rootTweetId, rootAuthorId: rootTweetAuthorId } =
        extractTweetId(editRoot);

      const tweetPermissions = await this.prisma.tweetPermissions.findMany({
        where: {
          tweetId: rootTweetId,
          rootAuthorId: rootTweetAuthorId,
        },
      });

      const viewGroupIds = tweetPermissions
        .filter(
          (tp) =>
            tp.type === TweetPermissionType.GROUP &&
            tp.permission === TweetPermission.CAN_VIEW,
        )
        .map((tp) => tp.typeId);

      const editGroupIds = tweetPermissions
        .filter(
          (tp) =>
            tp.type === TweetPermissionType.GROUP &&
            tp.permission === TweetPermission.CAN_EDIT,
        )
        .map((tp) => tp.typeId);

      const viewUserIds = await this.groupService.getAllUsersByGroupIds(
        rootTweetAuthorId,
        viewGroupIds,
      );
      const editUserIds = await this.groupService.getAllUsersByGroupIds(
        rootTweetAuthorId,
        editGroupIds,
      );

      viewUserIds.forEach((userId) => {
        appliedViewPermissions[userId] = {
          tweetId: rootTweetId,
          rootAuthorId: rootTweetAuthorId,
          permission: TweetPermission.CAN_VIEW,
          userId,
        };
      });

      editUserIds.forEach((userId) => {
        appliedEditPermissions[userId] = {
          tweetId: rootTweetId,
          rootAuthorId: rootTweetAuthorId,
          permission: TweetPermission.CAN_EDIT,
          userId,
        };
      });

      tweetPermissions
        .filter((tp) => tp.type === TweetPermissionType.USER)
        .forEach((tp) => {
          if (tp.permission === TweetPermission.CAN_VIEW) {
            appliedViewPermissions[tp.typeId] = {
              tweetId: rootTweetId,
              rootAuthorId: rootTweetAuthorId,
              permission: TweetPermission.CAN_VIEW,
              userId: tp.typeId,
            };
          } else {
            appliedEditPermissions[tp.typeId] = {
              tweetId: rootTweetId,
              rootAuthorId: rootTweetAuthorId,
              permission: TweetPermission.CAN_EDIT,
              userId: tp.typeId,
            };
          }
        });
    } else {
      const { id: viewTweetMainId, rootAuthorId: viewAuthorId } =
        extractTweetId(viewRoot);
      const { id: editTweetMainId, rootAuthorId: editAuthorId } =
        extractTweetId(editRoot);

      const viewTweetPermissions = await this.prisma.tweetPermissions.findMany({
        where: {
          tweetId: viewTweetMainId,
          rootAuthorId: viewAuthorId,
          permission: TweetPermission.CAN_VIEW,
        },
      });

      const editTweetPermissions = await this.prisma.tweetPermissions.findMany({
        where: {
          tweetId: editTweetMainId,
          rootAuthorId: editAuthorId,
          permission: TweetPermission.CAN_EDIT,
        },
      });

      const viewGroupIds = viewTweetPermissions
        .filter((tp) => tp.type === TweetPermissionType.GROUP)
        .map((tp) => tp.typeId);

      const editGroupIds = editTweetPermissions
        .filter((tp) => tp.type === TweetPermissionType.GROUP)
        .map((tp) => tp.typeId);

      const viewUserIds = await this.groupService.getAllUsersByGroupIds(
        viewAuthorId,
        viewGroupIds,
      );
      const editUserIds = await this.groupService.getAllUsersByGroupIds(
        editAuthorId,
        editGroupIds,
      );

      viewUserIds.forEach((userId) => {
        appliedViewPermissions[userId] = {
          tweetId: viewTweetMainId,
          rootAuthorId: viewAuthorId,
          permission: TweetPermission.CAN_VIEW,
          userId,
        };
      });

      editUserIds.forEach((userId) => {
        appliedEditPermissions[userId] = {
          tweetId: editTweetMainId,
          rootAuthorId: editAuthorId,
          permission: TweetPermission.CAN_EDIT,
          userId,
        };
      });

      viewTweetPermissions
        .filter((tp) => tp.type === TweetPermissionType.USER)
        .forEach((tp) => {
          appliedViewPermissions[tp.typeId] = {
            tweetId: viewTweetMainId,
            rootAuthorId: viewAuthorId,
            permission: TweetPermission.CAN_VIEW,
            userId: tp.typeId,
          };
        });

      editTweetPermissions
        .filter((tp) => tp.type === TweetPermissionType.USER)
        .forEach((tp) => {
          appliedViewPermissions[tp.typeId] = {
            tweetId: viewTweetMainId,
            rootAuthorId: viewAuthorId,
            permission: TweetPermission.CAN_EDIT,
            userId: tp.typeId,
          };
        });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tweetAppliedPermission.deleteMany({
        where: {
          tweetId: tweetMainId,
          rootAuthorId,
        },
      });

      await tx.tweetAppliedPermission.createMany({
        data: Object.keys(appliedViewPermissions)
          .map((userId) => appliedViewPermissions[userId])
          .concat(
            Object.keys(appliedEditPermissions).map(
              (userId) => appliedEditPermissions[userId],
            ),
          ),
      });
    });
  }

  async findRootTweets(
    tweetId: string,
  ): Promise<{ viewRoot: string | null; editRoot: string | null }> {
    const { id: tweetMainId, rootAuthorId } = extractTweetId(tweetId);

    const result = await this.prisma.$queryRawUnsafe<{
      view_root: string | null;
      edit_root: string | null;
    }>(
      `
      WITH RECURSIVE root_tweet_view AS (
          SELECT
              id,
              root_author_id,
              parent_tweet_id,
              inherit_view_permissions
          FROM
              tweets
          WHERE
              id = $1 AND root_author_id = $2
          UNION ALL
          SELECT
              t.id,
              t.root_author_id,
              t.parent_tweet_id,
              t.inherit_view_permissions
          FROM
              tweets t
          INNER JOIN
              root_tweet_view rt
          ON
              t.id = rt.parent_tweet_id AND t.root_author_id = rt.root_author_id
          WHERE
              rt.root_author_id=$2 AND rt.inherit_view_permissions = true
      ),
      root_tweet_edit AS (
          SELECT
              id,
              root_author_id,
              parent_tweet_id,
              inherit_edit_permissions
          FROM
              tweets
          WHERE
              id = $1 AND root_author_id = $2
          UNION ALL
          SELECT
              t.id,
              t.root_author_id,
              t.parent_tweet_id,
              t.inherit_edit_permissions
          FROM
              tweets t
          INNER JOIN
              root_tweet_edit rt
          ON
              t.id = rt.parent_tweet_id AND t.root_author_id = rt.root_author_id
          WHERE
            rt.root_author_id=$2 AND  rt.inherit_edit_permissions = true
      )
      SELECT
          (SELECT root_author_id || '_' || id FROM root_tweet_view WHERE root_author_id=$2 AND (parent_tweet_id IS NULL OR inherit_view_permissions = false ) LIMIT 1) AS view_root,
          (SELECT root_author_id || '_' || id FROM root_tweet_edit WHERE root_author_id=$2 AND (parent_tweet_id IS NULL OR inherit_edit_permissions = false ) LIMIT 1) AS edit_root;
    `,
      tweetMainId,
      rootAuthorId,
    );

    if (!result) {
      return {
        viewRoot: null,
        editRoot: null,
      };
    }

    return {
      viewRoot: result[0]?.view_root || null,
      editRoot: result[0]?.edit_root || null,
    };
  }

  async findChildTweetsInheritPermissions(
    tweetId: string,
  ): Promise<{ childViewTweets: string[]; childEditTweets: string[] }> {
    const { id: tweetMainId, rootAuthorId } = extractTweetId(tweetId);

    const result = await this.prisma.$queryRawUnsafe<
      {
        child_view_tweets: string | null;
        child_edit_tweets: string | null;
      }[]
    >(
      `
      WITH RECURSIVE child_tweet_view AS (
          SELECT
              id,
              root_author_id,
              parent_tweet_id,
              inherit_view_permissions
          FROM
              tweets
          WHERE
              id = $1 AND root_author_id = $2
          UNION ALL
          SELECT
              t.id,
              t.root_author_id,
              t.parent_tweet_id,
              t.inherit_view_permissions
          FROM
              tweets t
          INNER JOIN
              child_tweet_view cv
          ON
              t.parent_tweet_id = cv.id AND t.root_author_id = cv.root_author_id
          WHERE
              cv.root_author_id = $2 AND t.inherit_view_permissions = true
      ),
      child_tweet_edit AS (
          SELECT
              id,
              root_author_id,
              parent_tweet_id,
              inherit_edit_permissions
          FROM
              tweets
          WHERE
              id = $1 AND root_author_id = $2
          UNION ALL
          SELECT
              t.id,
              t.root_author_id,
              t.parent_tweet_id,
              t.inherit_edit_permissions
          FROM
              tweets t
          INNER JOIN
              child_tweet_edit ce
          ON
              t.parent_tweet_id = ce.id AND t.root_author_id = ce.root_author_id
          WHERE
              ce.root_author_id = $2 AND t.inherit_edit_permissions = true
      )
      SELECT
          ARRAY_AGG(cv.root_author_id || '_' || cv.id) AS child_view_tweets,
          ARRAY_AGG(ce.root_author_id || '_' || ce.id) AS child_edit_tweets
      FROM
          child_tweet_view cv, child_tweet_edit ce;
      `,
      tweetMainId,
      rootAuthorId,
    );

    if (!result || result.length === 0) {
      return {
        childViewTweets: [],
        childEditTweets: [],
      };
    }

    return {
      childViewTweets: result[0]?.child_view_tweets
        ? result[0].child_view_tweets.split(',')
        : [],
      childEditTweets: result[0]?.child_edit_tweets
        ? result[0].child_edit_tweets.split(',')
        : [],
    };
  }
}
