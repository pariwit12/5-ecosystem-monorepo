import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
});
export class CreateDtoParam extends createZodDto(CreateDtoParamSchema) {}

export const CreateDtoBodySchema = z.object({
  name: z
    .string({
      message: 'ชื่อต้องเป็น type: string เท่านั้น',
    })
    .trim()
    .min(1, 'กรุณาระบุชื่อ (ห้ามเป็นค่าว่าง)'),
});
export class CreateDtoBody extends createZodDto(CreateDtoBodySchema) {}

export class CreateCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: CreateDtoParam,
    public readonly body: CreateDtoBody,
  ) {}
}
