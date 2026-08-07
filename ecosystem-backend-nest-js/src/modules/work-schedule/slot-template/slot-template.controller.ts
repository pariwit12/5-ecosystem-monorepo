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
  CreateCommand,
  CreateDtoParam,
  CreateDtoBody,
} from './commands/create.command';

// ===========================
// (จบ) Import Type (Command)
// ===========================

// =========================
// Import Type (Query)
// =========================

import {
  GetSlotTemplateByIdQuery,
  GetSlotTemplateByIdResponse,
  GetSlotTemplateByIdDtoParam,
} from './queries/get-slot-template-by-id.query';

import {
  GetSlotTemplatesByPositionIdQuery,
  GetSlotTemplatesByPositionIdResponse,
  GetSlotTemplatesByPositionIdDtoParam,
} from './queries/get-slot-templates-by-position-id.query';

// =========================
// (จบ) Import Type (Query)
// =========================

@Controller('api/work-schedule/slot-template')
export class SlotTemplateController {
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
  async createWorkScheduleSlotTemplate(
    @Param() param: CreateDtoParam,
    @Body() body: CreateDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<CreateCommand, void>(
      new CreateCommand(clerkUser.sub, param, body),
    );
  }

  // ========================================================================================
  // (จบ) Method
  // ========================================================================================

  // ========================================================================================
  // Query
  // ========================================================================================

  // 1
  @Get('by-id/:slot_template_id')
  @UseGuards(ClerkAuthGuard)
  async getSlotTemplateById(
    @Param() param: GetSlotTemplateByIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetSlotTemplateByIdQuery,
      GetSlotTemplateByIdResponse
    >(new GetSlotTemplateByIdQuery(clerkUser.sub, param));
  }

  // 2
  @Get('by-position-id/:position_id')
  @UseGuards(ClerkAuthGuard)
  async getSlotTemplatesByPositionId(
    @Param() param: GetSlotTemplatesByPositionIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetSlotTemplatesByPositionIdQuery,
      GetSlotTemplatesByPositionIdResponse
    >(new GetSlotTemplatesByPositionIdQuery(clerkUser.sub, param));
  }

  // ========================================================================================
  // (จบ) Query
  // ========================================================================================
  //
}
