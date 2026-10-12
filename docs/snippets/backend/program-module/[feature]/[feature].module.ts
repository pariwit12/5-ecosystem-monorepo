import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// ==>>==>>== Import Controller ==<<==<<==

import {
  // ปรับตามใช้งานจริง
  FeatureController,

  // ปรับตามใช้งานจริง
} from './[feature].controller';

// ==>>==>>== (จบ) Import Controller ==<<==<<==

// ============================
// Import Handler (Method)
// ============================

import {
  // ปรับตามใช้งานจริง
  MethodManyAvailableOtherProgramOtherFeatureHandler,

  // ปรับตามใช้งานจริง
} from './commands/[method-many]-[available_null]-[other-program_null]-[other-feature_null].handler';

// ============================
// (จบ) Import Handler (Method)
// ============================

// ===========================
// Import Handler (Query)
// ===========================

import {
  // ปรับตามใช้งานจริง
  GetAvailableOtherProgramFeaturesHandler,

  // ปรับตามใช้งานจริง
} from './queries/get-[available_null]-[other-program_null]-[features_feature].handler';

// ===========================
// (จบ) Import Handler (Query)
// ===========================

// ====================================================
// จุดลงทะเบียน Handler (มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา)
// ====================================================

const CommandHandlers = [
  //
  // ปรับตามใช้งานจริง
  MethodManyAvailableOtherProgramOtherFeatureHandler,
];

const QueryHandlers = [
  //
  // ปรับตามใช้งานจริง
  GetAvailableOtherProgramFeaturesHandler,
];

// ====================================================
// (จบ) จุดลงทะเบียน Handler (มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา)
// ====================================================

// ==>>==>>== Main (ตั้งค่า Feature Module) ==<<==<<==

// ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)

@Module({
  imports: [CqrsModule],
  controllers: [
    // ปรับตามใช้งานจริง
    FeatureController,
  ],
  providers: [...CommandHandlers, ...QueryHandlers],
})

// ปรับตามใช้งานจริง
export class FeatureModule {}

// ==>>==>>== (จบ) Main (ตั้งค่า Feature Module) ==<<==<<==

// อย่าลืมไปลงทะเบียน Module ใน Module ชั้นเหนือกว่า 1 ชั้น หรือ app.module.ts
