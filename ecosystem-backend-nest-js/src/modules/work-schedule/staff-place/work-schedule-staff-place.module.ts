import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WorkScheduleStaffPlaceController } from './work-schedule-staff-place.controller';
import { GetStaffPlaceHandler } from './queries/get-staff-place.handler';
import { AccessControlModule } from '../../../common/access-control/access-control.module';

@Module({
  imports: [CqrsModule, AccessControlModule],
  controllers: [WorkScheduleStaffPlaceController],
  providers: [GetStaffPlaceHandler],
})
export class WorkScheduleStaffPlaceModule {}
