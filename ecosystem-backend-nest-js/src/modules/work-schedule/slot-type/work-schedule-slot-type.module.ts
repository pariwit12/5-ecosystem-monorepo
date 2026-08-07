import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SlotTypeController } from './work-schedule-slot-type.controller';

// ============================
// Import Handler (Method)
// ============================

import { CreateHandler } from './commands/create.handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import { GetSlotTypesByPositionIdHandler } from './queries/get-slot-types-by-position-id.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ====================================================
// จุดลงทะเบียน Handler (มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา)
// ====================================================

const CommandHandlers = [CreateHandler];

const QueryHandlers = [GetSlotTypesByPositionIdHandler];

// ====================================================
// (จบ) จุดลงทะเบียน Handler (มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา)
// ====================================================

@Module({
  imports: [CqrsModule],
  controllers: [SlotTypeController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class SlotTypeModule {}
