import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetSlotTemplateByIdDtoParamSchema = z.object({
  slot_template_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส slot_template_id ไม่ถูกต้อง',
  }),
});
export class GetSlotTemplateByIdDtoParam extends createZodDto(
  GetSlotTemplateByIdDtoParamSchema,
) {}

export class GetSlotTemplateByIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetSlotTemplateByIdDtoParam,
  ) {}
}

export interface GetSlotTemplateByIdResponse {
  slotTypeId: string;

  name: string;
  startTime: string;
  durationMinute: number;
}
