import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateTweetPermissionsInput {
  @Field()
  inheritViewPermissions: boolean;

  @Field()
  inheritEditPermissions: boolean;

  @Field(() => [String])
  viewPermissions: string[];

  @Field(() => [String])
  editPermissions: string[];
}
