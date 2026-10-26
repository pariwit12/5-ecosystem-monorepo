import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { MinMaxController } from './min-max.controller';

// ============================
// Import Handler (Method)
// ============================

import { CreateHandler } from './commands/create.handler';
import { UpdateHandler } from './commands/update.handler';
import { DeleteHandler } from './commands/delete.handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import { GetMinMaxsByPositionIdStartTimeEndTimeHandler } from './queries/get-min-maxs-by-position-id-start-time-end-time.handler';
import { GetMinMaxByIdHandler } from './queries/get-min-max-by-id.handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ====================================================
// จุดลงทะเบียน Handler (มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา)
// ====================================================

const CommandHandlers = [CreateHandler, UpdateHandler, DeleteHandler];

const QueryHandlers = [
  GetMinMaxsByPositionIdStartTimeEndTimeHandler,
  GetMinMaxByIdHandler,
];

// ====================================================
// (จบ) จุดลงทะเบียน Handler (มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา)
// ====================================================

// ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)

@Module({
  imports: [CqrsModule],
  controllers: [MinMaxController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class MinMaxModule {}
