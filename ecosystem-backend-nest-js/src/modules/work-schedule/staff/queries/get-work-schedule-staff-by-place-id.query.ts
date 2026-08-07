import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetWorkScheduleStaffByPlaceIdDtoParamSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสองค์กรไม่ถูกต้อง',
  }),
});
export class GetWorkScheduleStaffByPlaceIdDtoParam extends createZodDto(
  GetWorkScheduleStaffByPlaceIdDtoParamSchema,
) {}

export class GetWorkScheduleStaffByPlaceIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetWorkScheduleStaffByPlaceIdDtoParam,
  ) {}
}

export interface GetWorkScheduleStaffByPlaceIdResponse {
  workScheduleStaffs: {
    id: string;
    name: string;
  }[];
}
