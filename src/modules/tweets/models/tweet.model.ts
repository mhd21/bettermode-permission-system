import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { TweetCategory } from '@prisma/client';
import { TweetIDScalar } from 'src/gql/scalars/tweetID.scalar';

registerEnumType(TweetCategory, {
  name: 'TweetCategory',
});

@ObjectType()
export class Tweet {
  @Field(() => TweetIDScalar)
  id: string;

  @Field(() => String)
  authorId: string;

  @Field(() => String)
  content: string;

  @Field(() => [String], { nullable: true })
  hashtags?: string[];

  @Field(() => String, { nullable: true })
  parentTweetId?: string;

  @Field(() => TweetCategory, { nullable: true })
  category?: TweetCategory;

  @Field(() => String, { nullable: true })
  location?: string;
}
