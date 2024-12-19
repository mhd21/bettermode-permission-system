import { Injectable } from '@nestjs/common';
import { Group, GroupMember, MemberType } from '@prisma/client';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { CreateGroupInput } from 'src/modules/groups/dto/create-group.input';

import { ulid } from 'ulid';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async createGroup(
    input: CreateGroupInput,
  ): Promise<Group & { groupMembers: GroupMember[] }> {
    const { creatorId, name, userIds, groupIds } = input;

    const groupId = await this.prisma.$transaction(async (tx) => {
      const groupId = `GROUP${ulid()}`;
      await tx.group.create({
        data: {
          id: groupId,
          name,
          creatorId,
        },
      });

      await tx.groupMember.createMany({
        data: [
          ...userIds.map((userId) => ({
            groupCreatorId: creatorId,
            groupId,
            memberId: userId,
            memberType: MemberType.USER,
          })),
          ...groupIds.map((gId) => ({
            groupCreatorId: creatorId,
            groupId,
            memberId: gId,
            memberType: MemberType.GROUP,
          })),
        ],
      });

      return groupId;
    });

    return this.prisma.group.findFirst({
      include: {
        groupMembers: true,
      },
      where: {
        id: groupId,
        creatorId,
      },
    });
  }

  async getGroupsByCreator(
    creatorId: string,
  ): Promise<(Group & { groupMembers: GroupMember[] })[]> {
    return this.prisma.group.findMany({
      include: {
        groupMembers: true,
      },
      where: { creatorId },
    });
  }

  async getGroupById(
    creatorId: string,
    groupId: string,
  ): Promise<(Group & { groupMembers: GroupMember[] }) | null> {
    return this.prisma.group.findFirst({
      include: {
        groupMembers: true,
      },
      where: { id: groupId, creatorId },
    });
  }

  // groups are distributed by creatorId and users only access groups created by them
  async getAllUsersByGroupIds(
    creatorId: string,
    groupIds: string[],
  ): Promise<string[]> {
    const result = await this.prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `
      WITH RECURSIVE group_hierarchy AS (
          SELECT
              id AS group_id,
              creator_id
          FROM
              groups
          WHERE
              creator_id = ($1) AND id = ANY($2)
  
          UNION ALL
  
          SELECT
              gm.group_creator_id, gm.member_id AS group_id
          FROM
              group_hierarchy gh
          INNER JOIN
              group_members gm
          ON
              gh.creator_id = ($1) AND gh.group_id = gm.group_id
          WHERE
             gm.group_creator_id = ($1) AND gm.member_type = 'group'
      ),
      all_users AS (
          SELECT
              gm.group_creator_id,gm.member_id AS user_id
          FROM
              group_hierarchy gh
          INNER JOIN
              group_members gm
          ON
             gh.creator_id = ($1) AND gh.group_id = gm.group_id
          WHERE
             gm.group_creator_id = ($1) AND gm.member_type = 'user'
      )
      SELECT DISTINCT user_id
      FROM all_users;
    `,
      creatorId,
      groupIds,
    );

    return result.map((row) => row.user_id);
  }
}
