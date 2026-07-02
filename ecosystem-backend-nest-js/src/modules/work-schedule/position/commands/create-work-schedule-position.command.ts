import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================

export const CreateWorkSchedulePositionDtoParamSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส place_id ไม่ถูกต้อง',
  }),
});
export class CreateWorkSchedulePositionDtoParam extends createZodDto(
  CreateWorkSchedulePositionDtoParamSchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================================
// DTO ขาเข้า (Body)
// ==========================================

export const CreateWorkSchedulePositionDtoBodySchema = z.object({
  name: z
    .string({
      message: 'ชื่อ position ต้องเป็นตัวอักษรเท่านั้น',
    })
    .trim()
    .min(1, 'กรุณาระบุชื่อ position (ห้ามเป็นค่าว่าง)'),
});
export class CreateWorkSchedulePositionDtoBody extends createZodDto(
  CreateWorkSchedulePositionDtoBodySchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Body)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

export class CreateWorkSchedulePositionCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: CreateWorkSchedulePositionDtoParam,
    public readonly body: CreateWorkSchedulePositionDtoBody,
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================
