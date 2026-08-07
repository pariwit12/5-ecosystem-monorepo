import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetSlotTypesByPositionIdDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
});
export class GetSlotTypesByPositionIdDtoParam extends createZodDto(
  GetSlotTypesByPositionIdDtoParamSchema,
) {}

export class GetSlotTypesByPositionIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetSlotTypesByPositionIdDtoParam,
  ) {}
}

export interface GetSlotTypesByPositionIdResponse {
  slotTypes: {
    id: string;
    name: string;
  }[];
}
