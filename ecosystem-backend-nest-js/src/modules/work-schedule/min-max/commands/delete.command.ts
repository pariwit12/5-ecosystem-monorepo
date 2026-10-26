import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DeleteDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
  min_max_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส min_max_id ไม่ถูกต้อง',
  }),
});
export class DeleteDtoParam extends createZodDto(DeleteDtoParamSchema) {}

export class DeleteCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: DeleteDtoParam,
  ) {}
}
