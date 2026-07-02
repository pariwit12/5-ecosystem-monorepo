import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================

export const GetWorkSchedulePositionsByPlaceIdDtoParamSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส place_id ไม่ถูกต้อง',
  }),
});
export class GetWorkSchedulePositionsByPlaceIdDtoParam extends createZodDto(
  GetWorkSchedulePositionsByPlaceIdDtoParamSchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

export class GetWorkSchedulePositionsByPlaceIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetWorkSchedulePositionsByPlaceIdDtoParam,
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================

// ===========================
// 🚀 "หน้าตาข้อมูล" ขาออก
// ===========================

// เขียนเอง, ใช้ Omit, ใช้ Pick (ควรเขียนเอง ตรงนี้จะได้เป็นที่รวมหน้าตาของ Response ที่เดียว ไม่ต้องไปหาต่อ)

export interface GetWorkSchedulePositionsByPlaceIdResponse {
  positions: {
    id: string;
    name: string;
  }[];
}

// ===========================
// 🚀 (จบ) "หน้าตาข้อมูล" ขาออก
// ===========================
