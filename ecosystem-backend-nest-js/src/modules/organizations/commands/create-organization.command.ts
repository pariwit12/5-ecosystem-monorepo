import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// 🛡️ DTO ขาเข้า
export const CreateOrganizationDtoBodySchema = z.object({
  name: z
    .string({
      message: 'ชื่อองค์กรต้องเป็นตัวอักษรเท่านั้น',
    })
    .trim()
    .min(1, 'กรุณาระบุชื่อองค์กร (ห้ามเป็นค่าว่าง)'),
});

export class CreateOrganizationDtoBody extends createZodDto(
  CreateOrganizationDtoBodySchema,
) {}

// 📥 ใบสั่งงาน (Command Payload): รวม DTO กับข้อมูลลับ (clerkId) ส่งเข้า Bus
export class CreateOrganizationCommand {
  constructor(
    public readonly clerkId: string,
    public readonly body: CreateOrganizationDtoBody,
  ) {}
}

// 📤 ขาออก
export interface CreateOrganizationResponse {
  success: boolean;
  message: string;
  // organizationId: string;
  // organization: any; // อนาคตค่อยมาระบุ Type ที่ชัดเจนแทน any ได้ครับ
}
