import { Module } from '@nestjs/common';

// ==========================
// Import Feature Module
// ==========================

import { WorkScheduleLogInModule } from './log-in/work-schedule-log-in.module';
import { MinMaxModule } from './min-max/min-max.module';
import { WorkSchedulePlaceModule } from './place/work-schedule-place.module';
import { WorkSchedulePlacesModule } from './places/work-schedule-places.module';
import { WorkSchedulePositionModule } from './position/work-schedule-position.module';
import { SlotModule } from './slot/slot.module';
import { SlotTemplateModule } from './slot-template/slot-template.module';
import { SlotTypeModule } from './slot-type/work-schedule-slot-type.module';
import { WorkScheduleStaffModule } from './staff/work-schedule-staff.module';
import { WorkScheduleStaffPositionModule } from './staff-position/work-schedule-staff-position.module';

// ==========================
// (จบ) Import Feature Module
// ==========================

@Module({
  imports: [
    // ==============================
    // จุดลงทะเบียน Feature Module
    // ==============================

    WorkScheduleLogInModule,
    MinMaxModule,
    WorkSchedulePlaceModule,
    WorkSchedulePlacesModule,
    WorkSchedulePositionModule,
    SlotModule,
    SlotTemplateModule,
    SlotTypeModule,
    WorkScheduleStaffModule,
    WorkScheduleStaffPositionModule,

    // ==============================
    // (จบ) จุดลงทะเบียน Feature Module
    // ==============================
  ],
  controllers: [],
  providers: [],
})
export class WorkScheduleModule {}
