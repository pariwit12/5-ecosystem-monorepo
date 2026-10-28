import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SlotController } from './slot.controller';

// ============================
// Import Handler (Method)
// ============================

import { CreateWorkScheduleSlotHandler } from './commands/create-many.handler';
import { AutoCreateHandler } from './commands/auto-create.handler';
import { UpdateSlotHandler } from './commands/update-slot.handler';
import { DeleteSlotHandler } from './commands/delete-slot.handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import { GetSlotsByPositionIdStartTimeEndTimeHandler } from './queries/get-slots-by-position-id-start-time-end-time.handler';
import { GetMyWorkScheduleSlotsHandler } from './queries/get-my-work-schedule-slots.handler';
import { GetSlotByIdHandler } from './queries/get-slot-by-id.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

const CommandHandlers = [
  AutoCreateHandler,
  CreateWorkScheduleSlotHandler,
  UpdateSlotHandler,
  DeleteSlotHandler,
];
const QueryHandlers = [
  GetSlotsByPositionIdStartTimeEndTimeHandler,
  GetMyWorkScheduleSlotsHandler,
  GetSlotByIdHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [SlotController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class SlotModule {}
