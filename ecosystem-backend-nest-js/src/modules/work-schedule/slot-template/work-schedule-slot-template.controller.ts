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
  CreateWorkScheduleSlotTemplateCommand,
  CreateWorkScheduleSlotTemplateDtoParam,
  CreateWorkScheduleSlotTemplateDtoBody,
} from './commands/create-work-schedule-slot-template.command';

// ===========================
// (จบ) Import Type (Command)
// ===========================

// =========================
// Import Type (Query)
// =========================

import {
  GetWorkScheduleSlotTemplateByIdQuery,
  GetWorkScheduleSlotTemplateByIdResponse,
  GetWorkScheduleSlotTemplateByIdDtoParam,
} from './queries/get-work-schedule-slot-template-by-id.query';

import {
  GetWorkScheduleSlotTemplatesByPositionIdQuery,
  GetWorkScheduleSlotTemplatesByPositionIdResponse,
  GetWorkScheduleSlotTemplatesByPositionIdDtoParam,
} from './queries/get-work-schedule-slot-templates-by-position-id.query';

// =========================
// (จบ) Import Type (Query)
// =========================

@Controller('api/work-schedule/slot-template')
export class WorkScheduleSlotTemplateController {
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
  async createWorkScheduleSlotTemplate(
    @Param() param: CreateWorkScheduleSlotTemplateDtoParam,
    @Body() body: CreateWorkScheduleSlotTemplateDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<CreateWorkScheduleSlotTemplateCommand, void>(
      new CreateWorkScheduleSlotTemplateCommand(clerkUser.sub, param, body),
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

  @Get('by-id/:work_schedule_slot_template_id')
  @UseGuards(ClerkAuthGuard)
  async getWorkScheduleSlotTemplateById(
    @Param() param: GetWorkScheduleSlotTemplateByIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetWorkScheduleSlotTemplateByIdQuery,
      GetWorkScheduleSlotTemplateByIdResponse
    >(new GetWorkScheduleSlotTemplateByIdQuery(clerkUser.sub, param));
  }

  // ==========================================
  // [GET] Business Logic
  // ==========================================

  @Get('by-position-id/:work_schedule_position_id')
  @UseGuards(ClerkAuthGuard)
  async getWorkScheduleSlotTemplatesByPositionId(
    @Param() param: GetWorkScheduleSlotTemplatesByPositionIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetWorkScheduleSlotTemplatesByPositionIdQuery,
      GetWorkScheduleSlotTemplatesByPositionIdResponse
    >(new GetWorkScheduleSlotTemplatesByPositionIdQuery(clerkUser.sub, param));
  }

  // ========================================================================================
  // (จบ) Query
  // ========================================================================================
  //
}
