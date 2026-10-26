import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DeleteSlotDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
  slot_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส slot_id ไม่ถูกต้อง',
  }),
});

export class DeleteSlotDtoParam extends createZodDto(
  DeleteSlotDtoParamSchema,
) {}

export class DeleteSlotCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: DeleteSlotDtoParam,
  ) {}
}
