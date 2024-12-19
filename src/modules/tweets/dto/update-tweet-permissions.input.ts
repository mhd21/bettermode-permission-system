import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsBoolean, IsArray } from 'class-validator';

@InputType()
export class UpdateTweetPermissionsInput {
  @Field(() => Boolean)
  @IsBoolean()
  @IsNotEmpty()
  inheritViewPermissions: boolean;

  @Field(() => Boolean)
  @IsBoolean()
  @IsNotEmpty()
  inheritEditPermissions: boolean;

  @Field(() => [String])
  @IsArray()
  viewPermissions: string[];

  @Field(() => [String])
  @IsArray()
  editPermissions: string[];
}
