import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================

export const GetWorkSchedulePlaceByIdDtoParamSchema = z.object({
  work_schedule_place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส work_schedule_place_id ไม่ถูกต้อง',
  }),
});
export class GetWorkSchedulePlaceByIdDtoParam extends createZodDto(
  GetWorkSchedulePlaceByIdDtoParamSchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

export class GetWorkSchedulePlaceByIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetWorkSchedulePlaceByIdDtoParam,
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================

// ===========================
// 🚀 "หน้าตาข้อมูล" ขาออก
// ===========================

export interface GetWorkSchedulePlaceByIdResponse {
  timezone: string;
  name: string;
}

// ===========================
// 🚀 (จบ) "หน้าตาข้อมูล" ขาออก
// ===========================

// อย่าลืมไปลงทะเบียน ใน get-[template].handler.ts
