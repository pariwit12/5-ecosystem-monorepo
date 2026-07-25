import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetStaffPositionsByPositionIdDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
});
export class GetStaffPositionsByPositionIdDtoParam extends createZodDto(
  GetStaffPositionsByPositionIdDtoParamSchema,
) {}

export class GetStaffPositionsByPositionIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetStaffPositionsByPositionIdDtoParam,
  ) {}
}

export interface GetStaffPositionsByPositionIdResponse {
  staffPositions: {
    staffId: string;
    name: string;
  }[];
}
