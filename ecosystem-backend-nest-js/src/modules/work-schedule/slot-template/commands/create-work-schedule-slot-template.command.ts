import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================

export const CreateWorkScheduleSlotTemplateDtoParamSchema = z.object({
  work_schedule_position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสตำแหน่งงาน (work_schedule_position_id) ไม่ถูกต้อง',
  }),
});
export class CreateWorkScheduleSlotTemplateDtoParam extends createZodDto(
  CreateWorkScheduleSlotTemplateDtoParamSchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================================
// DTO ขาเข้า (Body)
// ==========================================

export const CreateWorkScheduleSlotTemplateDtoBodySchema = z.object({
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

  quantity: z
    .number({
      message: 'จำนวนตำแหน่งต้องเป็น type: number เท่านั้น',
    })
    .int({
      message: 'จำนวนตำแหน่งต้องเป็น จำนวนเต็มบวก เท่านั้น',
    })
    .min(1, 'จำนวนตำแหน่งต้องไม่ต่ำกว่า 1 นาที'),
});
export class CreateWorkScheduleSlotTemplateDtoBody extends createZodDto(
  CreateWorkScheduleSlotTemplateDtoBodySchema,
) {}

// ==========================================
// (จบ) DTO ขาเข้า (Body)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

export class CreateWorkScheduleSlotTemplateCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: CreateWorkScheduleSlotTemplateDtoParam,
    public readonly body: CreateWorkScheduleSlotTemplateDtoBody,
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================
