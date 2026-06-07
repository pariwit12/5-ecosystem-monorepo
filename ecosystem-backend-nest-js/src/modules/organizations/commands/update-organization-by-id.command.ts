import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================
export const UpdateOrganizationByIdDtoParamSchema = z.object({
  organization_id: z.uuid({
    version: 'v7', // 🌟 ล็อกให้เป็น UUIDv7 เท่านั้น เวอร์ชันอื่นส่งมาจะถูกดีดออกทันที
    message: 'รูปแบบรหัสองค์กรไม่ถูกต้อง',
  }),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class UpdateOrganizationByIdDtoParam extends createZodDto(
  UpdateOrganizationByIdDtoParamSchema,
) {}

// ==========================================
// DTO ขาเข้า (Body)
// ==========================================
export const UpdateOrganizationByIdDtoBodySchema = z.object({
  name: z
    .string({
      message: 'ชื่อองค์กรต้องเป็นตัวอักษรเท่านั้น',
    })
    .trim()
    .min(1, 'กรุณาระบุชื่อองค์กร (ห้ามเป็นค่าว่าง)'),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class UpdateOrganizationByIdDtoBody extends createZodDto(
  UpdateOrganizationByIdDtoBodySchema,
) {}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
export class UpdateOrganizationByIdCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: UpdateOrganizationByIdDtoParam,
    public readonly body: UpdateOrganizationByIdDtoBody,
  ) {}
}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาออก
export interface UpdateOrganizationByIdResponse {
  id: string;
  //   name: string;
}
