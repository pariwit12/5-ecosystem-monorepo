import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================

export const CreateWorkScheduleSlotDtoParamSchema = z.object({
  work_schedule_position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส work_schedule_position_id ไม่ถูกต้อง',
  }),
});
export class CreateWorkScheduleSlotDtoParam extends createZodDto(
  CreateWorkScheduleSlotDtoParamSchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================================
// DTO ขาเข้า (Body)
// ==========================================

export const CreateWorkScheduleSlotSchema = z
  .object({
    name: z
      .string({
        message: 'ชื่อต้องเป็น type: string เท่านั้น',
      })
      .trim()
      .min(1, 'กรุณาระบุชื่อ Slot (ห้ามเป็นค่าว่าง)'),

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
    (data) => new Date(data.actual_start_time) < new Date(data.actual_end_time),
    {
      message: 'actualEndTime ต้องมากกว่า actualStartTime เสมอ',

      path: ['actual_end_time'],
    },
  );
export const CreateWorkScheduleSlotDtoBodySchema = z.object({
  slots: z
    .array(CreateWorkScheduleSlotSchema)
    .min(1, 'ต้องส่งข้อมูล Slot มาอย่างน้อย 1 รายการ'), // บังคับว่าห้ามส่ง Array เปล่าๆ มา
});
export class CreateWorkScheduleSlotDtoBody extends createZodDto(
  CreateWorkScheduleSlotDtoBodySchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Body)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

export class CreateWorkScheduleSlotCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: CreateWorkScheduleSlotDtoParam,
    public readonly body: CreateWorkScheduleSlotDtoBody,
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================
