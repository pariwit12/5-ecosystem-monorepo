import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SubmitStaffInvitationBodyDtoSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9_-]{24}$/,
      'รหัสคำเชิญต้องมีความยาว 24 ตัวอักษรและอยู่ในรูปแบบที่ถูกต้อง',
    ),
});

export class SubmitStaffInvitationBodyDto extends createZodDto(
  SubmitStaffInvitationBodyDtoSchema,
) {}

export class SubmitStaffInvitationCommand {
  constructor(
    public readonly clerkId: string,
    public readonly body: SubmitStaffInvitationBodyDto,
  ) {}
}

export interface SubmitStaffInvitationResponse {
  invitationId: string;
  status: 'PENDING';
  expiresAt: string;
}
