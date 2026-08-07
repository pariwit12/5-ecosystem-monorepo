import { Controller, UseGuards, Get, Post, Param, Body } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';

import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../../common/guards/clerk-user.decorator';

// ==========================
// Import Type (Command)
// ==========================

import {
  CreateCommand,
  CreateDtoParam,
  CreateDtoBody,
} from './commands/create.command';

// ==========================
// (จบ) Import Type (Command)
// ==========================

// ========================
// Import Type (Query)
// ========================

import {
  GetSlotTypesByPositionIdQuery,
  GetSlotTypesByPositionIdResponse,
  GetSlotTypesByPositionIdDtoParam,
} from './queries/get-slot-types-by-position-id.query';

// ========================
// (จบ) Import Type (Query)
// ========================

@Controller('api/work-schedule/slot-type')
export class SlotTypeController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ===============================
  // ลงทะเบียน URL Path (Method)
  // ===============================

  // 1
  @Post(':position_id')
  @UseGuards(ClerkAuthGuard)
  async create(
    @Param() param: CreateDtoParam,
    @Body() body: CreateDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<CreateCommand, void>(
      new CreateCommand(clerkUser.sub, param, body),
    );
  }

  // ===============================
  // (จบ) ลงทะเบียน URL Path (Method)
  // ===============================

  // ==============================
  // ลงทะเบียน URL Path (Query)
  // ==============================

  // 1
  @Get('by-position-id/:position_id')
  @UseGuards(ClerkAuthGuard)
  async getSlotTypesByPositionId(
    @Param() param: GetSlotTypesByPositionIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetSlotTypesByPositionIdQuery,
      GetSlotTypesByPositionIdResponse
    >(new GetSlotTypesByPositionIdQuery(clerkUser.sub, param));
  }

  // ==============================
  // (จบ) ลงทะเบียน URL Path (Query)
  // ==============================
}
