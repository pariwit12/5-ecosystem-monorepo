import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WorkScheduleLogInController } from './work-schedule-log-in.controller';

// import { MethodTemplateHandler } from './commands/method-[template].handler';
import { GetUserRolesByClerkIdHandler } from './queries/get-user-roles-by-clerk-id.handler';

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
// const CommandHandlers = [MethodTemplateHandler];
const QueryHandlers = [GetUserRolesByClerkIdHandler];

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)
@Module({
  imports: [CqrsModule],
  controllers: [WorkScheduleLogInController],
  providers: [
    // ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class WorkScheduleLogInModule {}
