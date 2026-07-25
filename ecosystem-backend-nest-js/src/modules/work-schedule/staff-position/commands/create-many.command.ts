import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateManyDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
});

export class CreateManyDtoParam extends createZodDto(
  CreateManyDtoParamSchema,
) {}

export const CreateManyDtoBodySchema = z.object({
  staff_ids: z
    .array(
      z.uuid({
        version: 'v7',
        message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
      }),
    )
    .min(1, 'ต้องส่งข้อมูล Slot มาอย่างน้อย 1 รายการ'),
});

export class CreateManyDtoBody extends createZodDto(CreateManyDtoBodySchema) {}

export class CreateManyCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: CreateManyDtoParam,
    public readonly body: CreateManyDtoBody,
  ) {}
}
