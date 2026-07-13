import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// =======================
// Import Controller
// =======================

import { WorkSchedulePlaceController } from './work-schedule-place.controller';

// =======================
// (จบ) Import Controller
// =======================

// ===========================
// Import Handler (Query)
// ===========================

import { GetWorkSchedulePlaceByIdHandler } from './queries/get-work-schedule-place-by-id.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ===================================================================
// จุดลงทะเบียน Handler
// ===================================================================

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const QueryHandlers = [GetWorkSchedulePlaceByIdHandler];

// ===================================================================
// (จบ) จุดลงทะเบียน Handler
// ===================================================================

// ==========
// Main
// ==========

@Module({
  imports: [CqrsModule],
  controllers: [WorkSchedulePlaceController],
  providers: [...QueryHandlers],
})
export class WorkSchedulePlaceModule {}

// ==========
// (จบ) Main
// ==========
