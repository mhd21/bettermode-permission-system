import { Injectable } from '@nestjs/common';

import { Tweet, TweetPermission, TweetPermissionType } from '@prisma/client';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { CreateTweetInput } from 'src/modules/tweets/dto/create-tweet.input';
import { UpdateTweetPermissionsInput } from 'src/modules/tweets/dto/update-tweet-permissions.input';

import { ulid } from 'ulid';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TweetPermissionUpdatedEvent } from '../events/tweet-permissions-updated.event';
import { clientTweetId, extractTweetId } from 'src/shared/utils/idHelpers';

@Injectable()
export class TweetsService {
  constructor(
    private readonly prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createTweet(input: CreateTweetInput): Promise<Tweet> {
    const { authorId, content, hashtags, parentTweetId, category, location } =
      input;

    let parentRootAuthorId = null;
    let parentTweetMainId = null;
    if (parentTweetId) {
      const { id, rootAuthorId } = extractTweetId(parentTweetId);
      parentRootAuthorId = rootAuthorId;
      parentTweetMainId = id;

      const parentTweet = await this.prisma.tweet.findFirst({
        where: {
          id: parentTweetMainId,
          rootAuthorId: parentRootAuthorId,
        },
      });

      if (!parentTweet) {
        throw new Error('Parent tweet not found');
      }
    }

    const createdTweet = await this.prisma.tweet.create({
      select: {
        id: true,

        rootAuthorId: true,
      },
      data: {
        id: ulid(),
        rootAuthorId: parentRootAuthorId || authorId,
        authorId,
        content,
        hashtags,
        parentTweetId: parentTweetMainId,

        category,
        location,
      },
    });

    const tweet = await this.prisma.tweet.findFirst({
      where: {
        id: createdTweet.id,
        rootAuthorId: createdTweet.rootAuthorId,
      },
    });

    return {
      ...tweet,
      id: clientTweetId(tweet.id, tweet.authorId),
    };
  }

  async canEditTweet(userId: string, tweetId: string): Promise<boolean> {
    const { id, rootAuthorId } = extractTweetId(tweetId);
    const tweet = await this.prisma.tweet.findFirst({
      where: { rootAuthorId, id },
    });

    if (!tweet) {
      throw new Error('Tweet not found');
    }

    if (tweet.authorId === userId || tweet.isPublicEdit) {
      return true;
    }

    const tweetAppliedPermission =
      await this.prisma.tweetAppliedPermission.findFirst({
        where: {
          tweetId,
          userId,
          permission: TweetPermission.CAN_EDIT,
        },
      });

    return !!tweetAppliedPermission;
  }

  async updateTweetPermissions(
    tweetId: string,
    input: UpdateTweetPermissionsInput,
  ): Promise<boolean> {
    const {
      inheritViewPermissions,
      inheritEditPermissions,
      viewPermissions,
      editPermissions,
    } = input;

    const { id: tweetMainId, rootAuthorId } = extractTweetId(tweetId);

    const tweet = await this.prisma.tweet.findFirst({
      where: { id: tweetMainId, rootAuthorId },
    });

    if (!tweet) {
      throw new Error('Tweet not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const updatedData = {
        inheritViewPermissions,
        inheritEditPermissions,
        isPublicView: inheritViewPermissions && !tweet.parentTweetId,
        isPublicEdit: inheritEditPermissions && !tweet.parentTweetId,
      };

      await this.prisma.tweet.update({
        select: {
          id: true,
          rootAuthorId: true,
        },
        where: { rootAuthorId_id: { id: tweetMainId, rootAuthorId } },
        data: updatedData,
      });

      const tweetPermissions = [];

      for (const id of viewPermissions) {
        if (id.startsWith('USER')) {
          tweetPermissions.push({
            permission: TweetPermission.CAN_VIEW,
            type: TweetPermissionType.USER,
            tweetId: tweetMainId,
            rootAuthorId: rootAuthorId,
            typeId: id,
          });
        } else if (id.startsWith('GROUP')) {
          tweetPermissions.push({
            permission: TweetPermission.CAN_VIEW,
            type: TweetPermissionType.GROUP,
            tweetId: tweetMainId,
            rootAuthorId: rootAuthorId,
            typeId: id,
          });
        }
      }

      for (const id of editPermissions) {
        if (id.startsWith('USER')) {
          tweetPermissions.push({
            permission: TweetPermission.CAN_EDIT,
            type: TweetPermissionType.USER,
            tweetId: tweetMainId,
            rootAuthorId: rootAuthorId,
            typeId: id,
          });
        } else if (id.startsWith('GROUP')) {
          tweetPermissions.push({
            permission: TweetPermission.CAN_EDIT,
            type: TweetPermissionType.GROUP,
            tweetId: tweetMainId,
            rootAuthorId: rootAuthorId,
            typeId: id,
          });
        }
      }

      await tx.tweetPermissions.deleteMany({
        where: { tweetId: tweetMainId, rootAuthorId },
      });

      await tx.tweetPermissions.createMany({
        data: tweetPermissions,
      });
    });

    // TODO can be optimized to emit only if permissions are changed
    await this.eventEmitter.emitAsync(
      'tweet.permissions.updated',
      new TweetPermissionUpdatedEvent(tweetId),
    );

    return true;
  }
}
