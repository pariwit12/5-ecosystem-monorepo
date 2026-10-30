import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AutoCreateDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
});
export class AutoCreateDtoParam extends createZodDto(
  AutoCreateDtoParamSchema,
) {}

const selectedIds = (label: string) =>
  z
    .array(z.uuid({ version: 'v7', message: `รูปแบบรหัส ${label} ไม่ถูกต้อง` }))
    .min(1, `กรุณาเลือก ${label} อย่างน้อย 1 รายการ`)
    .refine(
      (ids) => new Set(ids.map((id) => id.toLowerCase())).size === ids.length,
      {
        message: `รหัส ${label} ต้องไม่ซ้ำกัน`,
      },
    );

export const AutoCreateDtoBodySchema = z
  .object({
    target_mode: z.enum(['MINIMUM', 'MAXIMUM']).default('MINIMUM'),
    assignment_mode: z
      .enum(['TRADITIONAL', 'MAXIMIZE_REST', 'BALANCE_TOTAL'])
      .default('TRADITIONAL'),
    start_time: z.string().datetime({ offset: true }),
    end_time: z.string().datetime({ offset: true }),
    slot_template_ids: selectedIds('Slot Template'),
    staff_ids: selectedIds('Staff'),
  })
  .refine((body) => new Date(body.end_time) > new Date(body.start_time), {
    message: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น',
    path: ['end_time'],
  });
export class AutoCreateDtoBody extends createZodDto(AutoCreateDtoBodySchema) {}

export interface AutoCreateResponse {
  createdCount: number;
}

export class AutoCreateCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: AutoCreateDtoParam,
    public readonly body: AutoCreateDtoBody,
  ) {}
}
