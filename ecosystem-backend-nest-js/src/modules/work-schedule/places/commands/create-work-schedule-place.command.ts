import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ฟังก์ชัน Native JS สำหรับตรวจสอบว่า String นั้นเป็น IANA Timezone ที่ถูกต้องจริงไหม
const isValidIanaTimezone = (tz: string): boolean => {
  try {
    // ถ้าผ่านคำสั่งนี้ได้โดยไม่แครช แปลว่าระบบรองรับ Timezone นี้จริง
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================
export const CreateWorkSchedulePlaceDtoParamSchema = z.object({
  organization_id: z.uuid({
    version: 'v7', // 🌟 ล็อกให้เป็น UUIDv7 เท่านั้น เวอร์ชันอื่นส่งมาจะถูกดีดออกทันที
    message: 'รูปแบบรหัสองค์กรไม่ถูกต้อง',
  }),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class CreateWorkSchedulePlaceDtoParam extends createZodDto(
  CreateWorkSchedulePlaceDtoParamSchema,
) {}

// ==========================================
// DTO ขาเข้า (Body)
// ==========================================
export const CreateWorkSchedulePlaceDtoBodySchema = z.object({
  name: z
    .string({
      message: 'ชื่อองค์กรต้องเป็นตัวอักษรเท่านั้น',
    })
    .trim()
    .min(1, 'กรุณาระบุชื่อองค์กร (ห้ามเป็นค่าว่าง)'),

  timezone: z.string().trim().refine(isValidIanaTimezone, {
    message:
      'timezone ไม่ถูกต้องตามมาตรฐาน IANA (ตัวอย่างที่ถูกต้อง: Asia/Bangkok)',
  }),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class CreateWorkSchedulePlaceDtoBody extends createZodDto(
  CreateWorkSchedulePlaceDtoBodySchema,
) {}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
export class CreateWorkSchedulePlaceCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: CreateWorkSchedulePlaceDtoParam,
    public readonly body: CreateWorkSchedulePlaceDtoBody,
  ) {}
}
