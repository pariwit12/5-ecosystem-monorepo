import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateManyDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
});
export class CreateManyDtoParam extends createZodDto(
  CreateManyDtoParamSchema,
) {}

export const CreateManyDtoBodySchema = z.object({
  slots: z
    .array(
      z
        .object({
          staff_id: z.uuid({
            version: 'v7',
            message: 'รูปแบบรหัส staff_id ไม่ถูกต้อง',
          }),

          slot_type_id: z.uuid({
            version: 'v7',
            message: 'รูปแบบรหัส slot_type_id ไม่ถูกต้อง',
          }),

          actual_start_time: z
            .string({
              message: 'actualStartTime ต้องเป็น type: string เท่านั้น',
            })
            .datetime({
              offset: true,

              message: 'actualStartTime ต้องอยู่ในรูปแบบ ISO 8601',
            }),

          actual_end_time: z
            .string({
              message: 'actualEndTime ต้องเป็น type: string เท่านั้น',
            })
            .datetime({
              offset: true,

              message: 'actualEndTime ต้องอยู่ในรูปแบบ ISO 8601',
            }),
        })
        .refine(
          (data) =>
            new Date(data.actual_start_time) < new Date(data.actual_end_time),
          {
            message: 'actualEndTime ต้องมากกว่า actualStartTime เสมอ',

            path: ['actual_end_time'],
          },
        ),
    )
    .min(1, 'ต้องส่งข้อมูล Slot มาอย่างน้อย 1 รายการ'), // บังคับว่าห้ามส่ง Array เปล่าๆ มา
});
export class CreateManyDtoBody extends createZodDto(CreateManyDtoBodySchema) {}

export class CreateManyCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: CreateManyDtoParam,
    public readonly body: CreateManyDtoBody,
  ) {}
}
