import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WorkScheduleStaffController } from './work-schedule-staff.controller';

import { CreateWorkScheduleStaffHandler } from './commands/create-work-schedule-staff.handler';

import { GetWorkScheduleStaffByPlaceIdHandler } from './queries/get-work-schedule-staff-by-place-id.handler';

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [CreateWorkScheduleStaffHandler];
const QueryHandlers = [GetWorkScheduleStaffByPlaceIdHandler];

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)
@Module({
  imports: [CqrsModule],
  controllers: [WorkScheduleStaffController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class WorkScheduleStaffModule {}
