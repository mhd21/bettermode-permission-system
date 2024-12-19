import { Module } from '@nestjs/common';

import { GqlModule } from './gql/gql.module';

import { GroupsModule } from './modules/groups/groups.module';
import { PrismaModule } from './shared/database/prisma/prisma.module';
import { TweetsModule } from './modules/tweets/tweets.module';
import { UsersModule } from './modules/users/users.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    GqlModule,
    GroupsModule,
    PrismaModule,
    TweetsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
