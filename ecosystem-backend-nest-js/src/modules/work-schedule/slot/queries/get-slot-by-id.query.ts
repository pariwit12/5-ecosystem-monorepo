import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetSlotByIdDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
  slot_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส slot_id ไม่ถูกต้อง',
  }),
});

export class GetSlotByIdDtoParam extends createZodDto(
  GetSlotByIdDtoParamSchema,
) {}

export class GetSlotByIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetSlotByIdDtoParam,
  ) {}
}

export interface GetSlotByIdResponse {
  id: string;
  staffId: string;
  staffName: string;
  slotTypeId: string;
  slotTypeName: string;
  actualStartTime: string;
  actualEndTime: string;
}
