import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================
export const GetWorkScheduleStaffByPlaceIdDtoParamSchema = z.object({
  place_id: z.uuid({
    version: 'v7', // 🌟 ล็อกให้เป็น UUIDv7 เท่านั้น เวอร์ชันอื่นส่งมาจะถูกดีดออกทันที
    message: 'รูปแบบรหัสองค์กรไม่ถูกต้อง',
  }),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class GetWorkScheduleStaffByPlaceIdDtoParam extends createZodDto(
  GetWorkScheduleStaffByPlaceIdDtoParamSchema,
) {}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
export class GetWorkScheduleStaffByPlaceIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetWorkScheduleStaffByPlaceIdDtoParam,
  ) {}
}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาออก
// เขียนเอง, ใช้ Omit, ใช้ Pick (ควรเขียนเอง ตรงนี้จะได้เป็นที่รวมหน้าตาของ Response ที่เดียว ไม่ต้องไปหาต่อ)
export interface GetWorkScheduleStaffByPlaceIdResponse {
  workScheduleStaffs: {
    id: string;
    name: string;
  }[];
}
