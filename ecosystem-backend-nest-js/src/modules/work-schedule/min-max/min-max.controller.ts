import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
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
import {
  UpdateCommand,
  UpdateDtoParam,
  UpdateDtoBody,
} from './commands/update.command';
import { DeleteCommand, DeleteDtoParam } from './commands/delete.command';

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
import {
  GetMinMaxByIdQuery,
  GetMinMaxByIdResponse,
  GetMinMaxByIdDtoParam,
} from './queries/get-min-max-by-id.query';

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

  @Patch('positions/:position_id/min-maxs/:min_max_id')
  @UseGuards(ClerkAuthGuard)
  async update(
    @Param() param: UpdateDtoParam,
    @Body() body: UpdateDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<UpdateCommand, void>(
      new UpdateCommand(clerkUser.sub, param, body),
    );
  }

  @Delete('positions/:position_id/min-maxs/:min_max_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(ClerkAuthGuard)
  async delete(
    @Param() param: DeleteDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<DeleteCommand, void>(
      new DeleteCommand(clerkUser.sub, param),
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

  @Get('positions/:position_id/min-maxs/:min_max_id')
  @UseGuards(ClerkAuthGuard)
  async getMinMaxById(
    @Param() param: GetMinMaxByIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<GetMinMaxByIdQuery, GetMinMaxByIdResponse>(
      new GetMinMaxByIdQuery(clerkUser.sub, param),
    );
  }

  // ==============================
  // (จบ) ลงทะเบียน URL Path (Query)
  // ==============================
}
