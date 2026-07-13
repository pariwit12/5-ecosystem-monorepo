import { Controller, UseGuards, Get, Post, Param, Body } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';

// =================================
// Import Guard and Decoration
// =================================

import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../../common/guards/clerk-user.decorator';

// =================================
// (จบ) Import Guard and Decoration
// =================================

// ===========================
// Import Type (Command)
// ===========================

import {
  CreateWorkScheduleSlotCommand,
  CreateWorkScheduleSlotDtoParam,
  CreateWorkScheduleSlotDtoBody,
} from './commands/create-work-schedule-slot.command';

// ===========================
// (จบ) Import Type (Command)
// ===========================

// =========================
// Import Type (Query)
// =========================

import {
  GetWorkScheduleSlotsByPositionIdQuery,
  GetWorkScheduleSlotsByPositionIdResponse,
  GetWorkScheduleSlotsByPositionIdDtoParam,
} from './queries/get-work-schedule-slots-by-position-id.query';

// =========================
// (จบ) Import Type (Query)
// =========================

@Controller('api/work-schedule/slot')
export class WorkScheduleSlotController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ========================================================================================
  // Method
  // ========================================================================================

  // ==========================================
  // [POST] Business Logic
  // ==========================================

  @Post(':work_schedule_position_id')
  @UseGuards(ClerkAuthGuard)
  async createWorkScheduleSlot(
    @Param() param: CreateWorkScheduleSlotDtoParam,
    @Body() body: CreateWorkScheduleSlotDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<CreateWorkScheduleSlotCommand, void>(
      new CreateWorkScheduleSlotCommand(clerkUser.sub, param, body),
    );
  }

  // ========================================================================================
  // (จบ) Method
  // ========================================================================================

  // ========================================================================================
  // Query
  // ========================================================================================

  // ==========================================
  // [GET] Business Logic
  // ==========================================

  @Get('by-position-id/:work_schedule_position_id')
  @UseGuards(ClerkAuthGuard)
  async getWorkScheduleSlotsByPositionId(
    @Param() param: GetWorkScheduleSlotsByPositionIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetWorkScheduleSlotsByPositionIdQuery,
      GetWorkScheduleSlotsByPositionIdResponse
    >(new GetWorkScheduleSlotsByPositionIdQuery(clerkUser.sub, param));
  }

  // ========================================================================================
  // (จบ) Query
  // ========================================================================================
  //
}
