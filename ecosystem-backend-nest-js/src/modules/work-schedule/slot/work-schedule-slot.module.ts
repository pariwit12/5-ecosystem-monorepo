import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// =======================
// Import Controller
// =======================

import { WorkScheduleSlotController } from './work-schedule-slot.controller';

// =======================
// (จบ) Import Controller
// =======================

// ============================
// Import Handler (Method)
// ============================

import { CreateWorkScheduleSlotHandler } from './commands/create-work-schedule-slot.handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import { GetWorkScheduleSlotsByPositionIdHandler } from './queries/get-work-schedule-slots-by-position-id.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ===================================================================
// จุดลงทะเบียน Handler
// ===================================================================

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [CreateWorkScheduleSlotHandler];
const QueryHandlers = [GetWorkScheduleSlotsByPositionIdHandler];

// ===================================================================
// (จบ) จุดลงทะเบียน Handler
// ===================================================================

// ==========
// Main
// ==========

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)

@Module({
  imports: [CqrsModule],
  controllers: [WorkScheduleSlotController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class WorkScheduleSlotModule {}

// ==========
// (จบ) Main
// ==========
