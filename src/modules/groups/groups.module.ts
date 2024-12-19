import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/shared/database/prisma/prisma.module';
import { GroupsService } from './services/groups.service';

@Module({
  imports: [PrismaModule],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
