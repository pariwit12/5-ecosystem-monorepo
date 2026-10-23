import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const IssueStaffInvitationParamDtoSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสสถานที่ทำงานไม่ถูกต้อง',
  }),
  staff_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสพนักงานไม่ถูกต้อง',
  }),
});

export class IssueStaffInvitationParamDto extends createZodDto(
  IssueStaffInvitationParamDtoSchema,
) {}

export class IssueStaffInvitationCommand {
  constructor(
    public readonly clerkId: string,
    public readonly param: IssueStaffInvitationParamDto,
  ) {}
}

export interface IssueStaffInvitationResponse {
  invitationId: string;
  code: string;
  expiresAt: string;
}
