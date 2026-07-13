import { Controller, UseGuards, Get, Param } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

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

// =========================
// Import Type (Query)
// =========================

import {
  GetWorkSchedulePlaceByIdQuery,
  GetWorkSchedulePlaceByIdResponse,
  GetWorkSchedulePlaceByIdDtoParam,
} from './queries/get-work-schedule-place-by-id.query';

// =========================
// (จบ) Import Type (Query)
// =========================

@Controller('api/work-schedule/place')
export class WorkSchedulePlaceController {
  constructor(private readonly queryBus: QueryBus) {}

  // ========================================================================================
  // Query
  // ========================================================================================

  // ==========================================
  // [GET] Business Logic
  // ==========================================

  @Get('by-id/:work_schedule_place_id')
  @UseGuards(ClerkAuthGuard)
  async getWorkSchedulePlaceById(
    @Param() param: GetWorkSchedulePlaceByIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetWorkSchedulePlaceByIdQuery,
      GetWorkSchedulePlaceByIdResponse
    >(new GetWorkSchedulePlaceByIdQuery(clerkUser.sub, param));
  }

  // ========================================================================================
  // (จบ) Query
  // ========================================================================================
  //
}
