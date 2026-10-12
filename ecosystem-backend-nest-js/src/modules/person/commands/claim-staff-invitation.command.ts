import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class ClaimStaffInvitationBody extends createZodDto(
  z.object({ code: z.string().trim().min(1) }),
) {}

export class ClaimStaffInvitationCommand {
  constructor(
    public readonly clerkId: string,
    public readonly code: string,
  ) {}
}
