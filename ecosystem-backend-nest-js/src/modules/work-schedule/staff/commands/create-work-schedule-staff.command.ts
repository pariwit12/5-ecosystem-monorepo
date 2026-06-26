import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================
export const CreateWorkScheduleStaffDtoParamSchema = z.object({
  place_id: z.uuid({
    version: 'v7', // 🌟 ล็อกให้เป็น UUIDv7 เท่านั้น เวอร์ชันอื่นส่งมาจะถูกดีดออกทันที
    message: 'รูปแบบรหัสองค์กรไม่ถูกต้อง',
  }),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class CreateWorkScheduleStaffDtoParam extends createZodDto(
  CreateWorkScheduleStaffDtoParamSchema,
) {}

// ==========================================
// DTO ขาเข้า (Body)
// ==========================================
export const CreateWorkScheduleStaffDtoBodySchema = z.object({
  name: z
    .string({
      message: 'ชื่อพนักงานต้องเป็นตัวอักษรเท่านั้น',
    })
    .trim()
    .min(1, 'กรุณาระบุชื่อพนักงาน (ห้ามเป็นค่าว่าง)'),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class CreateWorkScheduleStaffDtoBody extends createZodDto(
  CreateWorkScheduleStaffDtoBodySchema,
) {}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
export class CreateWorkScheduleStaffCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: CreateWorkScheduleStaffDtoParam,
    public readonly body: CreateWorkScheduleStaffDtoBody,
  ) {}
}
