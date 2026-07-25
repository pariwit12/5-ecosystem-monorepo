import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { WorkScheduleStaffPositionController } from './work-schedule-staff-position.controller';

// ============================
// Import Handler (Method)
// ============================

import { CreateManyHandler } from './commands/create-many.handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import { GetAvailableStaffsByPositionIdHandler } from './queries/get-available-staffs-by-position-id.handler';
import { GetStaffPositionsByPositionIdHandler } from './queries/get-staff-positions-by-position-id.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ===================================================================
// จุดลงทะเบียน Handler
// ===================================================================

const CommandHandlers = [CreateManyHandler];

const QueryHandlers = [
  GetAvailableStaffsByPositionIdHandler,
  GetStaffPositionsByPositionIdHandler,
];

// ===================================================================
// (จบ) จุดลงทะเบียน Handler
// ===================================================================

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)

@Module({
  imports: [CqrsModule],
  controllers: [WorkScheduleStaffPositionController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class WorkScheduleStaffPositionModule {}
