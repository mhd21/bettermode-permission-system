import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateGroupInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty()
  userIds: string[];

  @Field(() => [String])
  @IsArray()
  @IsNotEmpty()
  groupIds: string[];
}
