import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { DateTime } from 'luxon';

export const CreateHolidayDtoParamSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส place_id ไม่ถูกต้อง',
  }),
});

export class CreateHolidayDtoParam extends createZodDto(
  CreateHolidayDtoParamSchema,
) {}

const FullDayHolidaySchema = z
  .object({
    type: z.literal('FULL_DAY'),
    date: z
      .string({
        message: 'กรุณาระบุวันที่',
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'รูปแบบวันที่ต้องเป็น YYYY-MM-DD')
      .refine(
        (val) => {
          const dt = DateTime.fromISO(val);
          return dt.isValid;
        },
        {
          message: 'วันที่ไม่ถูกต้อง',
        },
      ),
  })
  .strict();

const PartialHolidaySchema = z
  .object({
    type: z.literal('PARTIAL'),
    start_time: z
      .string({
        message: 'start_time ต้องเป็น string',
      })
      .datetime({
        offset: true,
        message: 'start_time ต้องอยู่ในรูปแบบ ISO 8601 ที่มี offset',
      }),
    end_time: z
      .string({
        message: 'end_time ต้องเป็น string',
      })
      .datetime({
        offset: true,
        message: 'end_time ต้องอยู่ในรูปแบบ ISO 8601 ที่มี offset',
      }),
  })
  .strict()
  .superRefine((data, ctx) => {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    if (start.getTime() >= end.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น',
      });
    }
  });

export const CreateHolidayDtoBodySchema = z.discriminatedUnion('type', [
  FullDayHolidaySchema,
  PartialHolidaySchema,
]);

export type CreateHolidayDtoBodyType = z.infer<
  typeof CreateHolidayDtoBodySchema
>;

export class CreateHolidayDtoBody extends createZodDto(
  CreateHolidayDtoBodySchema as unknown as z.ZodObject<any>,
) {}

export class CreateHolidayCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: CreateHolidayDtoParam,
    public readonly body: CreateHolidayDtoBodyType,
  ) {}
}
