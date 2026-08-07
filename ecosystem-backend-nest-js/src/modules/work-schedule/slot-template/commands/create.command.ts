import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสตำแหน่งงาน (position_id) ไม่ถูกต้อง',
  }),
});
export class CreateDtoParam extends createZodDto(CreateDtoParamSchema) {}

export const CreateDtoBodySchema = z.object({
  slot_type_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบ slot_type_id ไม่ถูกต้อง',
  }),

  name: z
    .string({
      message: 'ชื่อต้องเป็น type: string เท่านั้น',
    })
    .trim()
    .min(1, 'กรุณาระบุชื่อ (ห้ามเป็นค่าว่าง)'),

  start_time: z
    .string({
      message: 'เวลาเริ่มต้นต้องเป็น type: string เท่านั้น',
    })
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      'รูปแบบเวลาไม่ถูกต้อง กรุณาใช้รูปแบบ HH:mm (เช่น 08:00, 20:30)',
    ),

  duration_minute: z
    .number({
      message: 'ระยะเวลาต้องเป็น type: number เท่านั้น',
    })
    .int({
      message: 'ระยะเวลาต้องเป็น จำนวนเต็มบวก เท่านั้น',
    })
    .min(1, 'ระยะเวลาต้องไม่ต่ำกว่า 1 นาที'),
});
export class CreateDtoBody extends createZodDto(CreateDtoBodySchema) {}

export class CreateCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: CreateDtoParam,
    public readonly body: CreateDtoBody,
  ) {}
}
