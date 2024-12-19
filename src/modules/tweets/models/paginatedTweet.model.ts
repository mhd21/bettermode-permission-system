import { Field, ObjectType } from '@nestjs/graphql';
import { Tweet } from './tweet.model';

@ObjectType()
export class PaginatedTweet {
  @Field(() => [Tweet])
  nodes: Tweet[];

  @Field(() => Boolean)
  hasNextPage: boolean;
}
