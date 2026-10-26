import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetMinMaxByIdDtoParamSchema = z.object({
  position_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส position_id ไม่ถูกต้อง',
  }),
  min_max_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัส min_max_id ไม่ถูกต้อง',
  }),
});
export class GetMinMaxByIdDtoParam extends createZodDto(
  GetMinMaxByIdDtoParamSchema,
) {}

export class GetMinMaxByIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: GetMinMaxByIdDtoParam,
  ) {}
}

export interface GetMinMaxByIdResponse {
  id: string;
  min: number | null;
  max: number | null;
  startTime: string;
  endTime: string;
}
