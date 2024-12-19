import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { PaginatedTweet } from 'src/modules/tweets/models/paginatedTweet.model';

import { Tweet } from 'src/modules/tweets/models/tweet.model';
import { TweetsService } from 'src/modules/tweets/services/tweets.service';
import { CreateTweetInput } from 'src/modules/tweets/dto/create-tweet.input';

import {
  PaginateTweets,
  PaginateTweetsWithCursor,
} from 'src/modules/tweets/dto/paginate-tweets.input';
import { UpdateTweetPermissionsInput } from 'src/modules/tweets/dto/update-tweet-permissions.input';
import { ReadTweetsService } from '../services/readTweet.service';
import { TweetIDScalar } from 'src/gql/scalars/tweetID.scalar';

@Resolver(() => Tweet)
export class TweetsResolver {
  constructor(
    private readonly tweetsService: TweetsService,
    private readonly readTweetService: ReadTweetsService,
  ) {}

  @Mutation(() => Tweet)
  async createTweet(@Args('input') input: CreateTweetInput): Promise<Tweet> {
    const tweet = await this.tweetsService.createTweet(input);

    return tweet;
  }

  @Mutation(() => Boolean)
  async updateTweetPermissions(
    @Args('tweetId', { type: () => TweetIDScalar }) tweetId: string,
    @Args('input') input: UpdateTweetPermissionsInput,
  ): Promise<boolean> {
    return this.tweetsService.updateTweetPermissions(tweetId, input);
  }

  async canEditTweet(
    @Args('userId') userId: string,
    @Args('tweetId', { type: () => TweetIDScalar }) tweetId: string,
  ): Promise<boolean> {
    return this.tweetsService.canEditTweet(userId, tweetId);
  }

  @Query(() => PaginatedTweet)
  async paginateTweets(@Args('input') input: PaginateTweets) {
    return this.readTweetService.paginateTweets(
      input.userId,
      input.limit,
      input.page,
      input.filter,
    );
  }

  @Query(() => PaginatedTweet)
  async paginateTweetsWithCursor(
    @Args('input') input: PaginateTweetsWithCursor,
  ) {
    return this.readTweetService.paginateTweetsWithCursor(
      input.userId,
      input.limit,
      input.cursor,
      input.filter,
    );
  }
}
