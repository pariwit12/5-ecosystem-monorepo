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
export const MethodTemplateDtoParamSchema = z.object({
  organization_id: z.uuid({
    version: 'v7', // 🌟 ล็อกให้เป็น UUIDv7 เท่านั้น เวอร์ชันอื่นส่งมาจะถูกดีดออกทันที
    message: 'รูปแบบรหัสองค์กรไม่ถูกต้อง',
  }),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class MethodTemplateDtoParam extends createZodDto(
  MethodTemplateDtoParamSchema,
) {}

// ==========================================
// DTO ขาเข้า (Body)
// ==========================================
export const MethodTemplateDtoBodySchema = z.object({
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
export class MethodTemplateDtoBody extends createZodDto(
  MethodTemplateDtoBodySchema,
) {}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
export class MethodTemplateCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: MethodTemplateDtoParam,
    public readonly body: MethodTemplateDtoBody,
  ) {}
}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาออก (หากไม่มีการคืนค่า ก็ลบส่วนนี้ออกได้เลย)
export interface MethodTemplateResponse {
  id: string;
  // name: string;
  // organizationId: string;
  // organization: any; // อนาคตค่อยมาระบุ Type ที่ชัดเจนแทน any ได้ครับ
  // organizationDentalClinic: {
  //   paymentStatus: PaymentStatus; // 👈 ใช้ Enum ของ Prisma ตรงๆ ได้เลย!
  //   subscriptionEndDate: Date | null;
  // } | null;
}

// อย่าลืมไปลงทะเบียน ใน [template].controller.ts
// อย่าลืมไปลงทะเบียน ใน method-[template].handler.ts
