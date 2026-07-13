import { Module } from '@nestjs/common';
import { WorkScheduleLogInModule } from './log-in/work-schedule-log-in.module';
import { WorkSchedulePlaceModule } from './place/work-schedule-place.module';
import { WorkSchedulePlacesModule } from './places/work-schedule-places.module';
import { WorkSchedulePositionModule } from './position/work-schedule-position.module';
import { WorkScheduleSlotModule } from './slot/work-schedule-slot.module';
import { WorkScheduleSlotTemplateModule } from './slot-template/work-schedule-slot-template.module';
import { WorkScheduleStaffModule } from './staff/work-schedule-staff.module';

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)
@Module({
  imports: [
    WorkScheduleLogInModule,
    WorkSchedulePlaceModule,
    WorkSchedulePlacesModule,
    WorkSchedulePositionModule,
    WorkScheduleSlotModule,
    WorkScheduleSlotTemplateModule,
    WorkScheduleStaffModule,
  ],
  controllers: [],
  providers: [],
})
export class WorkScheduleModule {}
