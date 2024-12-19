import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/shared/database/prisma/prisma.module';
import { GroupsModule } from 'src/modules/groups/groups.module';
import { TweetsService } from './services/tweets.service';
import { ReadTweetsService } from './services/readTweet.service';
import { TweetPermissionUpdatedListener } from './listeners/tweet-permissions-updated.listener';
import { TweetsAppliedPermissionsService } from './services/tweetAppliedPermissions.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    GroupsModule,
    BullModule.registerQueue({
      name: 'tweetPermissions',
    }),
  ],
  providers: [
    TweetsService,
    TweetsAppliedPermissionsService,
    ReadTweetsService,
    TweetPermissionUpdatedListener,
  ],
  exports: [TweetsService, ReadTweetsService],
})
export class TweetsModule {}
