import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// =======================
// Import Controller
// =======================

import {
  // ปรับตามใช้งานจริง
  TemplateController,

  // ปรับตามใช้งานจริง
} from './[template].controller';

// =======================
// (จบ) Import Controller
// =======================

// ============================
// Import Handler (Method)
// ============================

import {
  // ปรับตามใช้งานจริง
  MethodTemplateHandler,

  // ปรับตามใช้งานจริง
} from './commands/method-[template].handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import {
  // ปรับตามใช้งานจริง
  GetTemplateHandler,

  // ปรับตามใช้งานจริง
} from './queries/get-[template].handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ===================================================================
// จุดลงทะเบียน Handler
// ===================================================================

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [
  // ปรับตามใช้งานจริง
  MethodTemplateHandler, // ปรับตามใช้งานจริง
];
const QueryHandlers = [
  // ปรับตามใช้งานจริง
  GetTemplateHandler, // ปรับตามใช้งานจริง
];

// ===================================================================
// (จบ) จุดลงทะเบียน Handler
// ===================================================================

// ==========
// Main
// ==========

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)

@Module({
  imports: [CqrsModule],
  controllers: [
    TemplateController, // ปรับตามใช้งานจริง
  ],
  providers: [...CommandHandlers, ...QueryHandlers],
})

// ปรับตามใช้งานจริง
export class TemplateModule {}

// ==========
// (จบ) Main
// ==========

// อย่าลืมไปลงทะเบียน Module ใน Module ชั้นเหนือกว่า 1 ชั้น หรือ app.module.ts
