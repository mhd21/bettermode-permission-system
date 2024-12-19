import { GraphQLScalarType, Kind } from 'graphql';

export const TweetIDScalar = new GraphQLScalarType({
  name: 'TweetID',
  description:
    'Custom scalar for validating Tweet IDs in the format {rootAuthorId}_{tweetId}',
  serialize(value: string) {
    if (!/^[a-zA-Z0-9]+_[a-zA-Z0-9\-]+$/.test(value)) {
      throw new Error(
        'Invalid Tweet ID format. Must be {rootAuthorId}_{tweetId}',
      );
    }
    return value;
  },
  parseValue(value: string) {
    if (!/^[a-zA-Z0-9]+_[a-zA-Z0-9\-]+$/.test(value)) {
      throw new Error(
        'Invalid Tweet ID format. Must be {rootAuthorId}_{tweetId}',
      );
    }
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      if (!/^[a-zA-Z0-9]+_[a-zA-Z0-9\-]+$/.test(ast.value)) {
        throw new Error(
          'Invalid Tweet ID format. Must be {rootAuthorId}_{tweetId}',
        );
      }
      return ast.value;
    }
    throw new Error('Tweet ID must be a string.');
  },
});
