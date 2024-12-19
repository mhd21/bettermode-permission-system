export const clientTweetId = (tweetId: string, rootAuthorId: string) => {
  return `${rootAuthorId}_${tweetId}`;
};

export const extractTweetId = (tweetId: string) => {
  const split = tweetId.split('_');
  return { id: split[1], rootAuthorId: split[0] };
};
