import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetAvailableStaffsByPositionIdDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
});
export class GetAvailableStaffsByPositionIdDtoParam extends createZodDto(
  GetAvailableStaffsByPositionIdDtoParamSchema,
) {}

export class GetAvailableStaffsByPositionIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetAvailableStaffsByPositionIdDtoParam,
  ) {}
}

export interface GetAvailableStaffsByPositionIdResponse {
  availableStaffs: {
    id: string;
    name: string;
  }[];
}
