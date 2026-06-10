import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================
export const GetWorkSchedulePlacesByOrganizationIdDtoParamSchema = z.object({
  organization_id: z.uuid({
    version: 'v7', // 🌟 ล็อกให้เป็น UUIDv7 เท่านั้น เวอร์ชันอื่นส่งมาจะถูกดีดออกทันที
    message: 'รูปแบบรหัสองค์กรไม่ถูกต้อง',
  }),
});

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class GetWorkSchedulePlacesByOrganizationIdDtoParam extends createZodDto(
  GetWorkSchedulePlacesByOrganizationIdDtoParamSchema,
) {}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาเข้า
export class GetWorkSchedulePlacesByOrganizationIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetWorkSchedulePlacesByOrganizationIdDtoParam,
  ) {}
}

// 🌟 นี่คือ "หน้าตาข้อมูล" ขาออก
export interface GetWorkSchedulePlacesByOrganizationIdResponse {
  workSchedulePlaces: {
    id: string;
    name: string;
  }[];
}
