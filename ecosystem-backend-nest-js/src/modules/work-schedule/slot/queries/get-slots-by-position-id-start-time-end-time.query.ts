import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetSlotsByPositionIdStartTimeEndTimeDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
});
export class GetSlotsByPositionIdStartTimeEndTimeDtoParam extends createZodDto(
  GetSlotsByPositionIdStartTimeEndTimeDtoParamSchema,
) {}

export const GetSlotsByPositionIdStartTimeEndTimeDtoQuerySchema = z
  .object({
    start_time: z
      .string({
        message: 'start_time ต้องเป็น type: string เท่านั้น',
      })
      .datetime({
        offset: true,
        message: 'start_time ต้องอยู่ในรูปแบบ ISO 8601',
      }),

    end_time: z
      .string({
        message: 'end_time ต้องเป็น type: string เท่านั้น',
      })
      .datetime({
        offset: true,
        message: 'end_time ต้องอยู่ในรูปแบบ ISO 8601',
      }),
  })

  .refine((data) => new Date(data.start_time) < new Date(data.end_time), {
    message: 'end_time ต้องมีค่ามากกว่า start_time เสมอ',
    path: ['end_time'],
  });
export class GetSlotsByPositionIdStartTimeEndTimeDtoQuery extends createZodDto(
  GetSlotsByPositionIdStartTimeEndTimeDtoQuerySchema,
) {}

export class GetSlotsByPositionIdStartTimeEndTimeQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetSlotsByPositionIdStartTimeEndTimeDtoParam,
    public readonly queryFromUrl: GetSlotsByPositionIdStartTimeEndTimeDtoQuery,
  ) {}
}

export interface GetSlotsByPositionIdStartTimeEndTimeResponse {
  workScheduleSlots: {
    id: string;
    staffId: string;
    staffName: string;
    slotTypeId: string;
    slotTypeName: string;
    actualStartTime: string;
    actualEndTime: string;
  }[];
  minMaxs: {
    id: string;
    min: number | null;
    max: number | null;
    startTime: string;
    endTime: string;
  }[];
}
