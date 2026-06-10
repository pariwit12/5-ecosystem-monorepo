import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WorkSchedulePlacesController } from './work-schedule-places.controller';

import { CreateWorkSchedulePlaceHandler } from './commands/create-work-schedule-place.handler';
import { GetWorkSchedulePlacesByOrganizationIdHandler } from './queries/get-work-schedule-places-by-organization-id.handler';

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [CreateWorkSchedulePlaceHandler];
const QueryHandlers = [GetWorkSchedulePlacesByOrganizationIdHandler];

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)
@Module({
  imports: [CqrsModule],
  controllers: [WorkSchedulePlacesController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class WorkSchedulePlacesModule {}
