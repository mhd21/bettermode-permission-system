import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TweetPermissionUpdatedEvent } from '../events/tweet-permissions-updated.event';
import { TweetsAppliedPermissionsService } from '../services/tweetAppliedPermissions.service';
import { Job, Queue } from 'bullmq';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';

@Injectable()
@Processor('tweetPermissions')
export class TweetPermissionUpdatedListener extends WorkerHost {
  constructor(
    @InjectQueue('tweetPermissions')
    private readonly tweetPermissionsQueue: Queue,
    private readonly tweetsAppliedPermissionsService: TweetsAppliedPermissionsService,
  ) {
    super();
  }

  @OnEvent('tweet.permissions.updated', { async: true })
  async handleTweetPermissionsUpdatedEvent(event: TweetPermissionUpdatedEvent) {
    await this.tweetPermissionsQueue.add('update-tweet-permissions', {
      tweetId: event.tweetId,
    });
  }

  async process(job: Job<any, any, string>) {
    if (job.name === 'update-tweet-permissions') {
      await this.tweetsAppliedPermissionsService.updateTweetPermissions(
        job.data.tweetId,
      );
    }
  }
}
