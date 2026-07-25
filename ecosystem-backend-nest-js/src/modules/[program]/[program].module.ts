import { Module } from '@nestjs/common';

// ==========================
// Import Feature Module
// ==========================
import {
  // ปรับตามใช้งานจริง
  FeatureModule,

  // ปรับตามใช้งานจริง
} from './[feature]/[feature].module';
// ==========================
// (จบ) Import Feature Module
// ==========================

// ==>>==>>== Main (ตั้งค่า Program Module) ==<<==<<==

// ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)

@Module({
  imports: [
    FeatureModule, // ปรับตามใช้งานจริง
  ],
  controllers: [],
  providers: [],
})

// ปรับตามใช้งานจริง
export class ProgramModule {}

// ==>>==>>== (จบ) Main (ตั้งค่า Program Module) ==<<==<<==

// อย่าลืมไปลงทะเบียน Module ใน Module ชั้นเหนือกว่า 1 ชั้น หรือ app.module.ts
