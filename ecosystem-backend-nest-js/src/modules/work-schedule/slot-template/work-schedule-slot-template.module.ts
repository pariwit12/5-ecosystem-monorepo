import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// =======================
// Import Controller
// =======================

import { WorkScheduleSlotTemplateController } from './work-schedule-slot-template.controller';

// =======================
// (จบ) Import Controller
// =======================

// ============================
// Import Handler (Method)
// ============================

import { CreateWorkScheduleSlotTemplateHandler } from './commands/create-work-schedule-slot-template.handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import { GetWorkScheduleSlotTemplateByIdHandler } from './queries/get-work-schedule-slot-template-by-id.handler';
import { GetWorkScheduleSlotTemplatesByPositionIdHandler } from './queries/get-work-schedule-slot-templates-by-position-id.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ===================================================================
// จุดลงทะเบียน Handler
// ===================================================================

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [CreateWorkScheduleSlotTemplateHandler];
const QueryHandlers = [
  GetWorkScheduleSlotTemplateByIdHandler,
  GetWorkScheduleSlotTemplatesByPositionIdHandler,
];

// ===================================================================
// (จบ) จุดลงทะเบียน Handler
// ===================================================================

// ==========
// Main
// ==========

@Module({
  imports: [CqrsModule],
  controllers: [WorkScheduleSlotTemplateController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class WorkScheduleSlotTemplateModule {}

// ==========
// (จบ) Main
// ==========
