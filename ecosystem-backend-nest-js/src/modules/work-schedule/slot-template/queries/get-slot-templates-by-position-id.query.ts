import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetSlotTemplatesByPositionIdDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสตำแหน่งงานไม่ถูกต้อง',
  }),
});
export class GetSlotTemplatesByPositionIdDtoParam extends createZodDto(
  GetSlotTemplatesByPositionIdDtoParamSchema,
) {}

export class GetSlotTemplatesByPositionIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetSlotTemplatesByPositionIdDtoParam,
  ) {}
}

export interface GetSlotTemplatesByPositionIdResponse {
  slotTemplates: {
    id: string;
    name: string;
  }[];
}
