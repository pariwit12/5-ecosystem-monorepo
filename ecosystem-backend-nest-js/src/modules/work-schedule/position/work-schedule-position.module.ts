import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// =======================
// Import Controller
// =======================

import { WorkSchedulePositionController } from './work-schedule-position.controller';

// =======================
// (จบ) Import Controller
// =======================

// ============================
// Import Handler (Method)
// ============================

import { CreateWorkSchedulePositionHandler } from './commands/create-work-schedule-position.handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import { GetWorkSchedulePositionByIdHandler } from './queries/get-work-schedule-position-by-id.handler';
import { GetWorkSchedulePositionsByPlaceIdHandler } from './queries/get-work-schedule-positions-by-place-id.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ===================================================================
// จุดลงทะเบียน Handler
// ===================================================================

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [CreateWorkSchedulePositionHandler];
const QueryHandlers = [
  GetWorkSchedulePositionByIdHandler,
  GetWorkSchedulePositionsByPlaceIdHandler,
];

// ===================================================================
// (จบ) จุดลงทะเบียน Handler
// ===================================================================

// ==========
// Main
// ==========

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)

@Module({
  imports: [CqrsModule],
  controllers: [WorkSchedulePositionController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class WorkSchedulePositionModule {}

// ==========
// (จบ) Main
// ==========
