import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// 🌟 สามารถ import Enum มาจาก prisma ได้โดยตรง
// eslint-disable-next-line
import { TemplateEnumInSchemaPrisma } from '@prisma/client';

// ถ้าเขียนแค่ enum RoleStatus { ACTIVE, INACTIVE } TypeScript จะมองว่ามันคือ Numeric Enum (ตัวเลข)
export enum TemplateEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

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
export const GetTemplateDtoParamSchema = z.object({
  organization_id: z.uuid({
    version: 'v7', // 🌟 ล็อกให้เป็น UUIDv7 เท่านั้น เวอร์ชันอื่นส่งมาจะถูกดีดออกทันที
    message: 'รูปแบบรหัสองค์กรไม่ถูกต้อง',
  }),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class GetTemplateDtoParam extends createZodDto(
  GetTemplateDtoParamSchema,
) {}

// ==========================================
// DTO ขาเข้า (Query)
// ==========================================
export const GetTemplateDtoQuerySchema = z.object({
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
export class GetTemplateDtoQuery extends createZodDto(
  GetTemplateDtoQuerySchema,
) {}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
export class GetTemplateQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetTemplateDtoParam,
    public readonly queryFromUrl: GetTemplateDtoQuery,
  ) {}
}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาออก
// เขียนเอง, ใช้ Omit, ใช้ Pick (ควรเขียนเอง ตรงนี้จะได้เป็นที่รวมหน้าตาของ Response ที่เดียว ไม่ต้องไปหาต่อ)
export interface GetTemplateResponse {
  id: string;
  name: string;
  organizations: {
    id: string;
    name: string;
  }[];
}

// อย่าลืมไปลงทะเบียน ใน [template].controller.ts
// อย่าลืมไปลงทะเบียน ใน get-[template].handler.ts
