import { ObjectType, Field, InputType, ID } from '@nestjs/graphql';

@ObjectType()
export class Group {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  creatorId: string;

  @Field(() => [String])
  userIds: string[];

  @Field(() => [String])
  groupIds: string[];
}

@InputType()
export class CreateGroupInput {
  @Field(() => [String])
  userIds: string[];

  @Field(() => [String])
  groupIds: string[];
}
