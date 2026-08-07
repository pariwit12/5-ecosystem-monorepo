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
  GetMinMaxsByPositionIdStartTimeEndTimeQuery,
  GetMinMaxsByPositionIdStartTimeEndTimeResponse,
  GetMinMaxsByPositionIdStartTimeEndTimeDtoParam,
  GetMinMaxsByPositionIdStartTimeEndTimeDtoQuery,
} from './queries/get-min-maxs-by-position-id-start-time-end-time.query';

// ========================
// (จบ) Import Type (Query)
// ========================

@Controller('api/work-schedule/min-max')
export class MinMaxController {
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
  @Get('by-position-id-start-time-end-time/:position_id')
  @UseGuards(ClerkAuthGuard)
  async getMinMaxsByPositionIdStartTimeEndTime(
    @Param() param: GetMinMaxsByPositionIdStartTimeEndTimeDtoParam,
    @Query() queryFromUrl: GetMinMaxsByPositionIdStartTimeEndTimeDtoQuery,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetMinMaxsByPositionIdStartTimeEndTimeQuery,
      GetMinMaxsByPositionIdStartTimeEndTimeResponse
    >(
      new GetMinMaxsByPositionIdStartTimeEndTimeQuery(
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
