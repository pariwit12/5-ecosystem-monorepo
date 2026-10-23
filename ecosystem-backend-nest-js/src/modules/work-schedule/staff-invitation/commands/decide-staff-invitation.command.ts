import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DecideStaffInvitationParamDtoSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสสถานที่ทำงานไม่ถูกต้อง',
  }),
  invitation_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสคำเชิญไม่ถูกต้อง',
  }),
});

export class DecideStaffInvitationParamDto extends createZodDto(
  DecideStaffInvitationParamDtoSchema,
) {}

export const DecideStaffInvitationBodyDtoSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT'], {
    message: 'การตัดสินใจต้องเป็น APPROVE หรือ REJECT เท่านั้น',
  }),
});

export class DecideStaffInvitationBodyDto extends createZodDto(
  DecideStaffInvitationBodyDtoSchema,
) {}

export class DecideStaffInvitationCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: DecideStaffInvitationParamDto,
    public readonly body: DecideStaffInvitationBodyDto,
  ) {}
}

export interface DecideStaffInvitationResponse {
  invitationId: string;
  status: 'APPROVED' | 'REJECTED';
}
