import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { FilterTweet } from '../dto/paginate-tweets.input';
import { TweetPermission } from '@prisma/client';
import { clientTweetId } from 'src/shared/utils/idHelpers';

@Injectable()
export class ReadTweetsService {
  constructor(private readonly prisma: PrismaService) {}

  async paginateTweets(
    userId: string,
    limit: number,
    page: number,
    filter?: FilterTweet,
  ) {
    const offset = (page - 1) * limit;

    const AND = [];

    if (filter) {
      if (filter.hashtag) {
        AND.push({
          hashtags: {
            has: filter.hashtag,
          },
        });
      }

      if (filter.category) {
        AND.push({
          category: filter.category,
        });
      }

      if (filter.location) {
        AND.push({
          location: filter.location,
        });
      }

      if (filter.parentTweetId) {
        AND.push({
          parentTweetId: filter.parentTweetId,
        });
      }

      if (filter.authorId) {
        AND.push({
          authorId: filter.authorId,
        });
      }
    }

    const tweets = await this.prisma.tweet.findMany({
      where: {
        OR: [
          { authorId: userId },
          { isPublicView: true },
          {
            TweetAppliedPermission: {
              some: { userId, permission: TweetPermission.CAN_VIEW },
            },
          },
        ],
        AND,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const totalCount = await this.prisma.tweet.count({
      where: {
        OR: [
          { isPublicView: true },
          {
            TweetAppliedPermission: {
              some: { userId, permission: TweetPermission.CAN_VIEW },
            },
          },
        ],
      },
    });

    const hasNextPage = offset + limit < totalCount;

    return {
      nodes: tweets.map((tweet) => ({
        ...tweet,
        id: clientTweetId(tweet.id, tweet.authorId),
      })),
      hasNextPage,
    };
  }

  async paginateTweetsWithCursor(
    userId: string,
    limit: number,
    cursor?: string,
    filter?: FilterTweet,
  ) {
    const AND = [];

    if (filter) {
      if (filter.hashtag) {
        AND.push({
          hashtags: {
            has: filter.hashtag,
          },
        });
      }

      if (filter.category) {
        AND.push({
          category: filter.category,
        });
      }

      if (filter.location) {
        AND.push({
          location: filter.location,
        });
      }

      if (filter.parentTweetId) {
        AND.push({
          parentTweetId: filter.parentTweetId,
        });
      }

      if (filter.authorId) {
        AND.push({
          authorId: filter.authorId,
        });
      }
    }

    const tweets = await this.prisma.tweet.findMany({
      where: {
        OR: [
          { isPublicView: true },
          {
            TweetAppliedPermission: {
              some: { userId, permission: TweetPermission.CAN_VIEW },
            },
          },
        ],
        ...(cursor && { createdAt: { lt: new Date(cursor) } }),
        AND,
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasNextPage = tweets.length > limit;

    const nodes = hasNextPage ? tweets.slice(0, limit) : tweets;

    return {
      nodes: nodes.map((tweet) => ({
        ...tweet,
        id: clientTweetId(tweet.id, tweet.authorId),
      })),
      hasNextPage,
    };
  }
}
