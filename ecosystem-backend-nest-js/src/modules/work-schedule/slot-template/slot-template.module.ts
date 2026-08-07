import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SlotTemplateController } from './slot-template.controller';

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

import { GetSlotTemplateByIdHandler } from './queries/get-slot-template-by-id.handler';
import { GetSlotTemplatesByPositionIdHandler } from './queries/get-slot-templates-by-position-id.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ===================================================================
// จุดลงทะเบียน Handler
// ===================================================================

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [CreateHandler];
const QueryHandlers = [
  GetSlotTemplateByIdHandler,
  GetSlotTemplatesByPositionIdHandler,
];

// ===================================================================
// (จบ) จุดลงทะเบียน Handler
// ===================================================================

@Module({
  imports: [CqrsModule],
  controllers: [SlotTemplateController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class SlotTemplateModule {}
