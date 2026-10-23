import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListMyHolidaysDtoParamSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส place_id ไม่ถูกต้อง',
  }),
});

export class ListMyHolidaysDtoParam extends createZodDto(
  ListMyHolidaysDtoParamSchema,
) {}

export interface HolidayItemDto {
  id: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface ListMyHolidaysResponse {
  holidays: HolidayItemDto[];
}

export class ListMyHolidaysQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: ListMyHolidaysDtoParam,
  ) {}
}
