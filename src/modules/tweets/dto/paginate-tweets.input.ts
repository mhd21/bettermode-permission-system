import { Field, InputType } from '@nestjs/graphql';
import { TweetCategory } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

@InputType()
export class FilterTweet {
  @Field(() => String, { nullable: true })
  @IsOptional()
  authorId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  hashtag: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  parentTweetId?: string;

  @Field(() => TweetCategory, { nullable: true })
  @IsOptional()
  @IsEnum(TweetCategory)
  category?: TweetCategory;

  @Field(() => String, { nullable: true })
  @IsOptional()
  location?: string;
}

@InputType()
export class PaginateTweets {
  @Field(() => String)
  userId: string;

  @Field(() => Number)
  page: number;

  @Field(() => Number)
  limit: number;

  @Field(() => FilterTweet, { nullable: true })
  filter: FilterTweet;
}

@InputType()
export class PaginateTweetsWithCursor {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  cursor: string;

  @Field(() => Number)
  limit: number;

  @Field(() => FilterTweet, { nullable: true })
  @IsOptional()
  filter?: FilterTweet;
}
