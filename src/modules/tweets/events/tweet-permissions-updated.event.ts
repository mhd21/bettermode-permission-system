export class TweetPermissionUpdatedEvent {
  tweetId: string;

  constructor(tweetId: string) {
    this.tweetId = tweetId;
  }
}
