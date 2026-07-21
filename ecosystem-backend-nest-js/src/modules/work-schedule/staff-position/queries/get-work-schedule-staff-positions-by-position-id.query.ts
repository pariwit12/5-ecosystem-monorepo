import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================

export const GetWorkScheduleStaffPositionsByPositionIdDtoParamSchema = z.object(
  {
    work_schedule_position_id: z.uuid({
      version: 'v7',
      message: 'รูปแบบรหัส work_schedule_position_id ไม่ถูกต้อง',
    }),
  },
);
export class GetWorkScheduleStaffPositionsByPositionIdDtoParam extends createZodDto(
  GetWorkScheduleStaffPositionsByPositionIdDtoParamSchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

export class GetWorkScheduleStaffPositionsByPositionIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetWorkScheduleStaffPositionsByPositionIdDtoParam,
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================

// ===========================
// 🚀 "หน้าตาข้อมูล" ขาออก
// ===========================

export interface GetWorkScheduleStaffPositionsByPositionIdResponse {
  staffPositions: {
    workScheduleStaffId: string;
    name: string;
  }[];
}

// ===========================
// 🚀 (จบ) "หน้าตาข้อมูล" ขาออก
// ===========================
