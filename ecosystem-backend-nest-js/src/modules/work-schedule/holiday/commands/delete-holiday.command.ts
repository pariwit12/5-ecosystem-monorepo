import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DeleteHolidayDtoParamSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส place_id ไม่ถูกต้อง',
  }),
  holiday_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส holiday_id ไม่ถูกต้อง',
  }),
});

export class DeleteHolidayDtoParam extends createZodDto(
  DeleteHolidayDtoParamSchema,
) {}

export class DeleteHolidayCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: DeleteHolidayDtoParam,
  ) {}
}
