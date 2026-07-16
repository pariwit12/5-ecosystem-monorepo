import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================

export const GetWorkScheduleSlotTemplateByIdDtoParamSchema = z.object({
  work_schedule_slot_template_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส work_schedule_slot_template_id ไม่ถูกต้อง',
  }),
});
export class GetWorkScheduleSlotTemplateByIdDtoParam extends createZodDto(
  GetWorkScheduleSlotTemplateByIdDtoParamSchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

export class GetWorkScheduleSlotTemplateByIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetWorkScheduleSlotTemplateByIdDtoParam,
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================

// ===========================
// 🚀 "หน้าตาข้อมูล" ขาออก
// ===========================

export interface GetWorkScheduleSlotTemplateByIdResponse {
  name: string;
  startTime: string;
  durationMinute: number;
  quantity: number;
}

// ===========================
// 🚀 (จบ) "หน้าตาข้อมูล" ขาออก
// ===========================
