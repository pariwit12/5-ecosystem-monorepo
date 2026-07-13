import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================

export const GetWorkScheduleSlotTemplatesByPositionIdDtoParamSchema = z.object({
  work_schedule_position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสตำแหน่งงานไม่ถูกต้อง',
  }),
});
export class GetWorkScheduleSlotTemplatesByPositionIdDtoParam extends createZodDto(
  GetWorkScheduleSlotTemplatesByPositionIdDtoParamSchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

export class GetWorkScheduleSlotTemplatesByPositionIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetWorkScheduleSlotTemplatesByPositionIdDtoParam,
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================

// ===========================
// 🚀 "หน้าตาข้อมูล" ขาออก
// ===========================

export interface GetWorkScheduleSlotTemplatesByPositionIdResponse {
  slotTemplates: {
    id: string;
    name: string;
    startTime: string;
    durationMinute: number;
    quantity: number;
  }[];
}

// ===========================
// 🚀 (จบ) "หน้าตาข้อมูล" ขาออก
// ===========================
