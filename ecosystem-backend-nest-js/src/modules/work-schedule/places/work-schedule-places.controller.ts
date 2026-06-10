import { Controller, UseGuards, Get, Post, Param, Body } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';

import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../../common/guards/clerk-user.decorator';

import {
  CreateWorkSchedulePlaceCommand,
  CreateWorkSchedulePlaceDtoParam,
  CreateWorkSchedulePlaceDtoBody,
} from './commands/create-work-schedule-place.command';
import {
  GetWorkSchedulePlacesByOrganizationIdQuery,
  GetWorkSchedulePlacesByOrganizationIdResponse,
  GetWorkSchedulePlacesByOrganizationIdDtoParam,
} from './queries/get-work-schedule-places-by-organization-id.query';

@Controller('api/work-schedule/places')
export class WorkSchedulePlacesController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ==========================================
  // [POST]
  // ==========================================

  @Post(':organization_id')
  @UseGuards(ClerkAuthGuard)
  async createWorkSchedulePlace(
    @Param() param: CreateWorkSchedulePlaceDtoParam,
    @Body() body: CreateWorkSchedulePlaceDtoBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<CreateWorkSchedulePlaceCommand, void>(
      new CreateWorkSchedulePlaceCommand(clerkUser.sub, param, body),
    );
  }

  // ==========================================
  // [GET] OrganizationWorkSchedulePlace โดย organization_id
  // ==========================================

  @Get('by-organization-id/:organization_id')
  @UseGuards(ClerkAuthGuard)
  async getWorkSchedulePlacesByOrganizationId(
    @Param() param: GetWorkSchedulePlacesByOrganizationIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetWorkSchedulePlacesByOrganizationIdQuery,
      GetWorkSchedulePlacesByOrganizationIdResponse
    >(new GetWorkSchedulePlacesByOrganizationIdQuery(clerkUser.sub, param));
  }
}
