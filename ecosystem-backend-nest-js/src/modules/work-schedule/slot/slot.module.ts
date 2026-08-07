import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SlotController } from './slot.controller';

// ============================
// Import Handler (Method)
// ============================

import { CreateWorkScheduleSlotHandler } from './commands/create-many.handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import { GetSlotsByPositionIdStartTimeEndTimeHandler } from './queries/get-slots-by-position-id-start-time-end-time.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

const CommandHandlers = [CreateWorkScheduleSlotHandler];
const QueryHandlers = [GetSlotsByPositionIdStartTimeEndTimeHandler];

@Module({
  imports: [CqrsModule],
  controllers: [SlotController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class SlotModule {}
