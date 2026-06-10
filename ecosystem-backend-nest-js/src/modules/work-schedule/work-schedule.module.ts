import { Module } from '@nestjs/common';
import { WorkSchedulePlacesModule } from './places/work-schedule-places.module';

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)
@Module({
  imports: [WorkSchedulePlacesModule],
  controllers: [],
  providers: [],
})
export class WorkScheduleModule {}
