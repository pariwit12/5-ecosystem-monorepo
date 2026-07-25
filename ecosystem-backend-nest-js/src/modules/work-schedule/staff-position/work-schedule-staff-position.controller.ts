import { Controller, UseGuards, Get, Post, Param, Body } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';

import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../../common/guards/clerk-user.decorator';

// ===========================
// Import Type (Command)
// ===========================

import {
  CreateManyCommand,
  CreateManyDtoParam,
  CreateManyDtoBody,
} from './commands/create-many.command';

// ===========================
// (จบ) Import Type (Command)
// ===========================

// =========================
// Import Type (Query)
// =========================

import {
  GetAvailableStaffsByPositionIdQuery,
  GetAvailableStaffsByPositionIdResponse,
  GetAvailableStaffsByPositionIdDtoParam,
} from './queries/get-available-staffs-by-position-id.query';
import {
  GetStaffPositionsByPositionIdQuery,
  GetStaffPositionsByPositionIdResponse,
  GetStaffPositionsByPositionIdDtoParam,
} from './queries/get-staff-positions-by-position-id.query';

// =========================
// (จบ) Import Type (Query)
// =========================

@Controller('api/work-schedule/staff-position')
export class WorkScheduleStaffPositionController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ========================================================================================
  // Method
  // ========================================================================================

  // 1
  @Post(':position_id')
  @UseGuards(ClerkAuthGuard)
  async createMany(
    @Param() param: CreateManyDtoParam,
    @Body() body: CreateManyDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<CreateManyCommand, void>(
      new CreateManyCommand(clerkUser.sub, param, body),
    );
  }

  // ========================================================================================
  // (จบ) Method
  // ========================================================================================

  // ========================================================================================
  // Query
  // ========================================================================================

  // 1
  @Get('available-staffs-by-position-id/:position_id')
  @UseGuards(ClerkAuthGuard)
  async getAvailableStaffsByPositionId(
    @Param()
    param: GetAvailableStaffsByPositionIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetAvailableStaffsByPositionIdQuery,
      GetAvailableStaffsByPositionIdResponse
    >(new GetAvailableStaffsByPositionIdQuery(clerkUser.sub, param));
  }

  // 2
  @Get('by-position-id/:position_id')
  @UseGuards(ClerkAuthGuard)
  async getStaffPositionsByPositionId(
    @Param() param: GetStaffPositionsByPositionIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetStaffPositionsByPositionIdQuery,
      GetStaffPositionsByPositionIdResponse
    >(new GetStaffPositionsByPositionIdQuery(clerkUser.sub, param));
  }

  // ========================================================================================
  // (จบ) Query
  // ========================================================================================
  //
}
