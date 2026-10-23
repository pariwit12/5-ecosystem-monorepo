import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetStaffPlaceParamDtoSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสสถานที่ทำงานไม่ถูกต้อง',
  }),
});

export class GetStaffPlaceParamDto extends createZodDto(
  GetStaffPlaceParamDtoSchema,
) {}

export class GetStaffPlaceQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetStaffPlaceParamDto,
  ) {}
}

export interface GetStaffPlaceResponse {
  placeId: string;
  name: string;
  timezone: string;
  staff: {
    id: string;
    name: string;
  };
}
