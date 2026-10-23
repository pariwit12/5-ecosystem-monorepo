import {
  Controller,
  UseGuards,
  Get,
  Post,
  Param,
  Query,
  Body,
} from '@nestjs/common';
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
  GetSlotsByPositionIdStartTimeEndTimeQuery,
  GetSlotsByPositionIdStartTimeEndTimeResponse,
  GetSlotsByPositionIdStartTimeEndTimeDtoParam,
  GetSlotsByPositionIdStartTimeEndTimeDtoQuery,
} from './queries/get-slots-by-position-id-start-time-end-time.query';
import {
  GetMyWorkScheduleSlotsDtoParam,
  GetMyWorkScheduleSlotsDtoQuery,
  GetMyWorkScheduleSlotsQuery,
  GetMyWorkScheduleSlotsResponse,
} from './queries/get-my-work-schedule-slots.query';

// =========================
// (จบ) Import Type (Query)
// =========================

@Controller('api/work-schedule/slot')
export class SlotController {
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
  async createMany(
    @Param() param: CreateManyDtoParam,
    @Body() body: CreateManyDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<CreateManyCommand, void>(
      new CreateManyCommand(clerkUser.sub, param, body),
    );
  }

  // ===============================
  // (จบ) ลงทะเบียน URL Path (Method)
  // ===============================

  // ==============================
  // ลงทะเบียน URL Path (Query)
  // ==============================

  // 1
  @Get('my/places/:place_id')
  @UseGuards(ClerkAuthGuard)
  async getMyWorkScheduleSlots(
    @Param() param: GetMyWorkScheduleSlotsDtoParam,
    @Query() queryFromUrl: GetMyWorkScheduleSlotsDtoQuery,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetMyWorkScheduleSlotsQuery,
      GetMyWorkScheduleSlotsResponse
    >(new GetMyWorkScheduleSlotsQuery(clerkUser.sub, param, queryFromUrl));
  }

  // 2
  @Get('by-position-id-start-time-end-time/:position_id')
  @UseGuards(ClerkAuthGuard)
  async getSlotsByPositionIdStartTimeEndTime(
    @Param() param: GetSlotsByPositionIdStartTimeEndTimeDtoParam,
    @Query() queryFromUrl: GetSlotsByPositionIdStartTimeEndTimeDtoQuery,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetSlotsByPositionIdStartTimeEndTimeQuery,
      GetSlotsByPositionIdStartTimeEndTimeResponse
    >(
      new GetSlotsByPositionIdStartTimeEndTimeQuery(
        clerkUser.sub,
        param,
        queryFromUrl,
      ),
    );
  }

  // ==============================
  // (จบ) ลงทะเบียน URL Path (Query)
  // ==============================
}
