import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UnlinkStaffInvitationParamDtoSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสสถานที่ทำงานไม่ถูกต้อง',
  }),
  staff_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสพนักงานไม่ถูกต้อง',
  }),
});

export class UnlinkStaffInvitationParamDto extends createZodDto(
  UnlinkStaffInvitationParamDtoSchema,
) {}

export class UnlinkStaffInvitationCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: UnlinkStaffInvitationParamDto,
  ) {}
}
