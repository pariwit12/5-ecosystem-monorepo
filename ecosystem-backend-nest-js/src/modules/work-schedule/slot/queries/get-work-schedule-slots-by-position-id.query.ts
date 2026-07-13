import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================

export const GetWorkScheduleSlotsByPositionIdDtoParamSchema = z.object({
  work_schedule_position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส work_schedule_position_id ไม่ถูกต้อง',
  }),
});
export class GetWorkScheduleSlotsByPositionIdDtoParam extends createZodDto(
  GetWorkScheduleSlotsByPositionIdDtoParamSchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

export class GetWorkScheduleSlotsByPositionIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetWorkScheduleSlotsByPositionIdDtoParam,
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================

// ===========================
// 🚀 "หน้าตาข้อมูล" ขาออก
// ===========================

export interface GetWorkScheduleSlotsByPositionIdResponse {
  workScheduleSlots: {
    id: string;
    workScheduleStaffId: string | null;
    workScheduleStaffName: string | null;
    name: string;
    actualStartTime: string;
    actualEndTime: string;
  }[];
}

// ===========================
// 🚀 (จบ) "หน้าตาข้อมูล" ขาออก
// ===========================
