import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';

import { Group } from 'src/modules/groups/models/group.model';
import { CreateGroupInput } from 'src/modules/groups/dto/create-group.input';
import { GroupsService } from '../services/groups.service';
import { MemberType } from '@prisma/client';

@Resolver(() => Group)
export class GroupsResolver {
  constructor(private readonly groupsService: GroupsService) {}

  @Mutation(() => Group)
  async createGroup(@Args('input') input: CreateGroupInput): Promise<Group> {
    const group = await this.groupsService.createGroup(input);
    return {
      id: group.id,
      name: group.name,
      creatorId: group.creatorId,
      groupIds: group.groupMembers
        .filter((gm) => gm.memberType === MemberType.GROUP)
        .map((gm) => gm.memberId),
      userIds: group.groupMembers
        .filter((gm) => gm.memberType === MemberType.USER)
        .map((gm) => gm.memberId),
    };
  }

  @Query(() => [Group])
  async getGroupsByCreator(
    @Args('creatorId') creatorId: string,
  ): Promise<Group[]> {
    const groups = await this.groupsService.getGroupsByCreator(creatorId);
    return groups.map((group) => {
      const userIds = group.groupMembers
        .filter((gm) => gm.memberType === MemberType.USER)
        .map((gm) => gm.memberId);

      const groupIds = group.groupMembers
        .filter((gm) => gm.memberType === MemberType.GROUP)
        .map((gm) => gm.memberId);

      return {
        id: group.id,
        name: group.name,
        creatorId: group.creatorId,
        userIds,
        groupIds,
      };
    });
  }
}
