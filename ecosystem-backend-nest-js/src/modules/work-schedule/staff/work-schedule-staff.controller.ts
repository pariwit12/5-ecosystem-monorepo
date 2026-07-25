import { Controller, UseGuards, Get, Post, Param, Body } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';

import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../../common/guards/clerk-user.decorator';

import {
  CreateWorkScheduleStaffCommand,
  CreateWorkScheduleStaffDtoParam,
  CreateWorkScheduleStaffDtoBody,
} from './commands/create-work-schedule-staff.command';

import {
  GetWorkScheduleStaffByPlaceIdQuery,
  GetWorkScheduleStaffByPlaceIdResponse,
  GetWorkScheduleStaffByPlaceIdDtoParam,
} from './queries/get-work-schedule-staff-by-place-id.query';

@Controller('api/work-schedule/staff')
export class WorkScheduleStaffController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ==========================================
  // [POST] Business Logic
  // ==========================================

  @Post(':place_id')
  @UseGuards(ClerkAuthGuard)
  async createWorkScheduleStaff(
    @Param() param: CreateWorkScheduleStaffDtoParam,
    @Body() body: CreateWorkScheduleStaffDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<CreateWorkScheduleStaffCommand, void>(
      new CreateWorkScheduleStaffCommand(clerkUser.sub, param, body),
    );
  }

  // ==========================================
  // [GET] Business Logic
  // ==========================================

  @Get('by-place-id/:place_id')
  @UseGuards(ClerkAuthGuard)
  async getWorkScheduleStaffByPlaceId(
    @Param() param: GetWorkScheduleStaffByPlaceIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetWorkScheduleStaffByPlaceIdQuery,
      GetWorkScheduleStaffByPlaceIdResponse
    >(new GetWorkScheduleStaffByPlaceIdQuery(clerkUser.sub, param));
  }
}
