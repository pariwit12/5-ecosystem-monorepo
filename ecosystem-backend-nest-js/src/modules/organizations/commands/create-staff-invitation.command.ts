import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { IdentityDocumentInputSchema } from '../../person/identity-document';

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
    identityDocument: IdentityDocumentInputSchema.optional(),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
  })
  .refine((data) => !(data.cid && data.identityDocument), {
    message: 'ระบุ cid หรือ identityDocument อย่างใดอย่างหนึ่งเท่านั้น',
  })
  .refine(
    (data) =>
      (!data.cid && !data.identityDocument) ||
      (data.firstName && data.lastName),
    {
      message: 'ต้องระบุชื่อและนามสกุลเมื่อลงทะเบียนเอกสารล่วงหน้า',
    },
  );

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
