import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// =======================
// Import Controller
// =======================

import { WorkScheduleStaffPositionController } from './work-schedule-staff-position.controller';

// =======================
// (จบ) Import Controller
// =======================

// ============================
// Import Handler (Method)
// ============================

import {
  // ปรับตามใช้งานจริง
  MethodTemplateHandler,

  // ปรับตามใช้งานจริง
} from './commands/method-[template].handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import { GetWorkScheduleStaffPositionsByPositionIdHandler } from './queries/get-work-schedule-staff-positions-by-position-id.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ===================================================================
// จุดลงทะเบียน Handler
// ===================================================================

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [
  // ปรับตามใช้งานจริง
  MethodTemplateHandler, // ปรับตามใช้งานจริง
];
const QueryHandlers = [GetWorkScheduleStaffPositionsByPositionIdHandler];

// ===================================================================
// (จบ) จุดลงทะเบียน Handler
// ===================================================================

// ==========
// Main
// ==========

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)

@Module({
  imports: [CqrsModule],
  controllers: [WorkScheduleStaffPositionController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class WorkScheduleStaffPositionModule {}

// ==========
// (จบ) Main
// ==========
