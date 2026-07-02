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
  CreateWorkSchedulePositionCommand,
  CreateWorkSchedulePositionDtoParam,
  CreateWorkSchedulePositionDtoBody,
} from './commands/create-work-schedule-position.command';

// ===========================
// (จบ) Import Type (Command)
// ===========================

// =========================
// Import Type (Query)
// =========================

import {
  GetWorkSchedulePositionByIdQuery,
  GetWorkSchedulePositionByIdResponse,
  GetWorkSchedulePositionByIdDtoParam,
} from './queries/get-work-schedule-position-by-id.query';

import {
  GetWorkSchedulePositionsByPlaceIdQuery,
  GetWorkSchedulePositionsByPlaceIdResponse,
  GetWorkSchedulePositionsByPlaceIdDtoParam,
} from './queries/get-work-schedule-positions-by-place-id.query';

// =========================
// (จบ) Import Type (Query)
// =========================

@Controller('api/work-schedule/position')
export class WorkSchedulePositionController {
  //
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

  @Post(':place_id')
  @UseGuards(ClerkAuthGuard)
  async createWorkSchedulePosition(
    @Param() param: CreateWorkSchedulePositionDtoParam,
    @Body() body: CreateWorkSchedulePositionDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<CreateWorkSchedulePositionCommand, void>(
      new CreateWorkSchedulePositionCommand(clerkUser.sub, param, body),
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

  @Get('by-id/:position_id')
  @UseGuards(ClerkAuthGuard)
  async getWorkSchedulePositionById(
    @Param() param: GetWorkSchedulePositionByIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetWorkSchedulePositionByIdQuery,
      GetWorkSchedulePositionByIdResponse
    >(new GetWorkSchedulePositionByIdQuery(clerkUser.sub, param));
  }

  // ==========================================
  // [GET] Business Logic
  // ==========================================

  @Get('by-place-id/:place_id')
  @UseGuards(ClerkAuthGuard)
  async getWorkSchedulePositionsByPlaceId(
    @Param() param: GetWorkSchedulePositionsByPlaceIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetWorkSchedulePositionsByPlaceIdQuery,
      GetWorkSchedulePositionsByPlaceIdResponse
    >(new GetWorkSchedulePositionsByPlaceIdQuery(clerkUser.sub, param));
  }

  // ========================================================================================
  // (จบ) Query
  // ========================================================================================
  //
}
