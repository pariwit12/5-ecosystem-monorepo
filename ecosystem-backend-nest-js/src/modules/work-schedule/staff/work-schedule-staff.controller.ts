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
    @Param() param: CreateWorkScheduleStaffDtoParam, // 🌟 ใช้ DTO จากไฟล์ Command / Query
    @Body() body: CreateWorkScheduleStaffDtoBody, // 🌟 ใช้ DTO จากไฟล์ Command / Query
    @ClerkUser() clerkUser: ClerkUserData, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูล user จาก ClerkAuthGuard มาใช้ได้เลย
  ) {
    return this.commandBus.execute<
      CreateWorkScheduleStaffCommand,
      void // หากไม่มีการคืนค่า ให้ใส่ void แทน MethodTemplateResponse
    >(new CreateWorkScheduleStaffCommand(clerkUser.sub, param, body));
  }

  // ==========================================
  // [GET] Business Logic
  // ==========================================

  @Get('by-place-id/:place_id')
  @UseGuards(ClerkAuthGuard)
  async getWorkScheduleStaffByPlaceId(
    @Param() param: GetWorkScheduleStaffByPlaceIdDtoParam, // 🌟 ใช้ DTO จากไฟล์ Command / Query
    @ClerkUser() clerkUser: ClerkUserData, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูล user จาก ClerkAuthGuard มาใช้ได้เลย
  ) {
    return this.queryBus.execute<
      GetWorkScheduleStaffByPlaceIdQuery,
      GetWorkScheduleStaffByPlaceIdResponse
    >(new GetWorkScheduleStaffByPlaceIdQuery(clerkUser.sub, param));
  }
}
