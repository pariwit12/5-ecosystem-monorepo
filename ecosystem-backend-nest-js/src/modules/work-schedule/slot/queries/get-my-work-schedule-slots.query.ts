import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetMyWorkScheduleSlotsDtoParamSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส place_id ไม่ถูกต้อง',
  }),
});
export class GetMyWorkScheduleSlotsDtoParam extends createZodDto(
  GetMyWorkScheduleSlotsDtoParamSchema,
) {}

export const GetMyWorkScheduleSlotsDtoQuerySchema = z
  .object({
    start_time: z.string().datetime({
      offset: true,
      message: 'start_time ต้องอยู่ในรูปแบบ ISO 8601',
    }),
    end_time: z.string().datetime({
      offset: true,
      message: 'end_time ต้องอยู่ในรูปแบบ ISO 8601',
    }),
  })
  .refine((data) => new Date(data.start_time) < new Date(data.end_time), {
    message: 'end_time ต้องมีค่ามากกว่า start_time เสมอ',
    path: ['end_time'],
  });
export class GetMyWorkScheduleSlotsDtoQuery extends createZodDto(
  GetMyWorkScheduleSlotsDtoQuerySchema,
) {}

export interface GetMyWorkScheduleSlotsResponse {
  workScheduleSlots: {
    id: string;
    slotTypeName: string;
    actualStartTime: string;
    actualEndTime: string;
  }[];
}

export class GetMyWorkScheduleSlotsQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetMyWorkScheduleSlotsDtoParam,
    public readonly queryFromUrl: GetMyWorkScheduleSlotsDtoQuery,
  ) {}
}
