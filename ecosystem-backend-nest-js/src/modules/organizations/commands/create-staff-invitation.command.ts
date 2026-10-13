import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateStaffInvitationBodySchema = z
  .object({
    role: z.enum([
      'ADMIN',
      'MANAGER',
      'RECEPTIONIST',
      'DENTAL_ASSISTANT',
      'ACCOUNTING',
      'OTHER',
    ]),
    cid: z
      .string()
      .trim()
      .regex(/^\d{13}$/)
      .optional(),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
  })
  .refine((data) => !data.cid || (data.firstName && data.lastName), {
    message: 'ต้องระบุชื่อและนามสกุลเมื่อลงทะเบียนด้วย CID',
  });

export class CreateStaffInvitationBody extends createZodDto(
  CreateStaffInvitationBodySchema,
) {}

export class CreateStaffInvitationCommand {
  constructor(
    public readonly clerkId: string,
    public readonly organizationId: string,
    public readonly clinicId: string,
    public readonly body: CreateStaffInvitationBody,
  ) {}
}
