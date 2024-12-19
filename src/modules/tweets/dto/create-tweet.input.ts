import { InputType, Field } from '@nestjs/graphql';
import { TweetCategory } from '@prisma/client';

import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

@InputType()
export class CreateTweetInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  authorId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  content: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  hashtags?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  parentTweetId?: string;

  @Field(() => TweetCategory, { nullable: true })
  @IsOptional()
  @IsEnum(TweetCategory)
  category?: TweetCategory;

  @Field(() => String, { nullable: true })
  @IsOptional()
  location?: string;
}
