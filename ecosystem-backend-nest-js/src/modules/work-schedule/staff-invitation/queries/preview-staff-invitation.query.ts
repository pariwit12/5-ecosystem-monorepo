import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PreviewStaffInvitationBodyDtoSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9_-]{24}$/,
      'รหัสคำเชิญต้องมีความยาว 24 ตัวอักษรและอยู่ในรูปแบบที่ถูกต้อง',
    ),
});

export class PreviewStaffInvitationBodyDto extends createZodDto(
  PreviewStaffInvitationBodyDtoSchema,
) {}

export class PreviewStaffInvitationQuery {
  constructor(
    public readonly clerkId: string,
    public readonly body: PreviewStaffInvitationBodyDto,
  ) {}
}

export interface PreviewStaffInvitationResponse {
  invitationId: string;
  staffName: string;
  placeName: string;
  expiresAt: string;
}
