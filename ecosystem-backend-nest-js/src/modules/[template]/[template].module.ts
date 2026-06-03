import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TemplateController } from './[template].controller';

import { MethodTemplateHandler } from './commands/method-[template].handler';
import { GetTemplateHandler } from './queries/get-[template].handler';

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [MethodTemplateHandler];
const QueryHandlers = [GetTemplateHandler];

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)
@Module({
  imports: [CqrsModule],
  controllers: [TemplateController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class TemplateModule {}

// อย่าลืมไปลงทะเบียน Module ใน app.module.ts
