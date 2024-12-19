import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { Module } from '@nestjs/common';
import { GroupsResolver } from '../modules/groups/graphql/groups.resolver';
import { GroupsModule } from 'src/modules/groups/groups.module';
import { TweetsResolver } from '../modules/tweets/graphql/tweets.resolver';
import { TweetsModule } from 'src/modules/tweets/tweets.module';
import { UsersResolver } from '../modules/users/graphql/users.resolver';
import { UsersModule } from 'src/modules/users/users.module';
import { TweetIDScalar } from './scalars/tweetID.scalar';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      resolvers: { TweetID: TweetIDScalar },
    }),
    UsersModule,
    GroupsModule,
    TweetsModule,
  ],
  providers: [UsersResolver, GroupsResolver, TweetsResolver],
})
export class GqlModule {}
