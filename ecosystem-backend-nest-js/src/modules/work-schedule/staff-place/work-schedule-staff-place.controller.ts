import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import { ClerkUser } from '../../../common/guards/clerk-user.decorator';
import {
  GetStaffPlaceParamDto,
  GetStaffPlaceQuery,
  GetStaffPlaceResponse,
} from './queries/get-staff-place.query';

@Controller('api/work-schedule/staff-place')
@UseGuards(ClerkAuthGuard)
export class WorkScheduleStaffPlaceController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':place_id')
  async getStaffPlace(
    @ClerkUser('sub') clerkId: string,
    @Param() param: GetStaffPlaceParamDto,
  ): Promise<GetStaffPlaceResponse> {
    return this.queryBus.execute(new GetStaffPlaceQuery(clerkId, param));
  }
}
