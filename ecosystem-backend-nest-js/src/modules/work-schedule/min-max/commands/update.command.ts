import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
  min_max_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส min_max_id ไม่ถูกต้อง',
  }),
});
export class UpdateDtoParam extends createZodDto(UpdateDtoParamSchema) {}

export const UpdateDtoBodySchema = z
  .object({
    min: z
      .number({ message: 'min ต้องเป็น type: number เท่านั้น' })
      .int({ message: 'min ต้องเป็น จำนวนเต็ม เท่านั้น' })
      .min(0, 'min ต้องไม่ต่ำกว่า 0')
      .nullable(),
    max: z
      .number({ message: 'max ต้องเป็น type: number เท่านั้น' })
      .int({ message: 'max ต้องเป็น จำนวนเต็ม เท่านั้น' })
      .min(0, 'max ต้องไม่ต่ำกว่า 0')
      .nullable(),
    start_time: z
      .string({ message: 'start_time ต้องเป็น type: string เท่านั้น' })
      .datetime({
        offset: true,
        message: 'start_time ต้องอยู่ในรูปแบบ ISO 8601',
      }),
    end_time: z
      .string({ message: 'end_time ต้องเป็น type: string เท่านั้น' })
      .datetime({
        offset: true,
        message: 'end_time ต้องอยู่ในรูปแบบ ISO 8601',
      }),
  })
  .refine((data) => data.min !== null || data.max !== null, {
    message: 'min และ max ห้ามเป็นค่าว่างพร้อมกัน',
    path: ['min'],
  })
  .refine(
    (data) =>
      data.min !== null && data.max !== null ? data.min <= data.max : true,
    {
      message: 'min ห้ามมีค่ามากกว่า max',
      path: ['max'],
    },
  )
  .refine((data) => new Date(data.start_time) < new Date(data.end_time), {
    message: 'end_time ต้องมีค่ามากกว่า start_time เสมอ',
    path: ['end_time'],
  });
export class UpdateDtoBody extends createZodDto(UpdateDtoBodySchema) {}

export class UpdateCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: UpdateDtoParam,
    public readonly body: UpdateDtoBody,
  ) {}
}
