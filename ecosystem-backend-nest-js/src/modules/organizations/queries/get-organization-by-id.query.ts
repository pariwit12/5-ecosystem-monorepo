import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// 🛡️ DTO ขาเข้า
export const GetOrganizationByIdDtoParamSchema = z.object({
  organization_id: z.uuid({
    version: 'v7', // 🌟 ล็อกให้เป็น UUIDv7 เท่านั้น เวอร์ชันอื่นส่งมาจะถูกดีดออกทันที
    message: 'รูปแบบรหัสองค์กรไม่ถูกต้อง',
  }),
});

// แปลงเป็น DTO Class ให้ NestJS ไหลผ่าน Pipe
export class GetOrganizationByIdDtoParam extends createZodDto(
  GetOrganizationByIdDtoParamSchema,
) {}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
export class GetOrganizationByIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetOrganizationByIdDtoParam,
  ) {}
}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาออก
export interface GetOrganizationByIdResponse {
  id: string;
  name: string;
}
