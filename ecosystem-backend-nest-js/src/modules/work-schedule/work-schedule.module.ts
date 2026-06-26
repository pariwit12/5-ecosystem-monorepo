import { Module } from '@nestjs/common';
import { WorkSchedulePlacesModule } from './places/work-schedule-places.module';
import { WorkScheduleLogInModule } from './log-in/work-schedule-log-in.module';
import { WorkScheduleStaffModule } from './staff/work-schedule-staff.module';

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)
@Module({
  imports: [
    WorkSchedulePlacesModule,
    WorkScheduleLogInModule,
    WorkScheduleStaffModule,
  ],
  controllers: [],
  providers: [],
})
export class WorkScheduleModule {}
