import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { IdentityDocumentInputSchema } from '../identity-document';

export const CreateDentalPatientBodySchema = z
  .object({
    organizationDentalClinicId: z.string().uuid(),
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    cid: z
      .string()
      .trim()
      .regex(/^\d{13}$/)
      .optional(),
    identityDocument: IdentityDocumentInputSchema.optional(),
    phone: z.string().trim().min(1).optional(),
    birthDate: z.coerce.date().optional(),
  })
  .strict()
  .refine((body) => !(body.cid && body.identityDocument), {
    message: 'ระบุ cid หรือ identityDocument อย่างใดอย่างหนึ่งเท่านั้น',
  });

export class CreateDentalPatientBody extends createZodDto(
  CreateDentalPatientBodySchema,
) {}

export class CreateDentalPatientCommand {
  constructor(
    public readonly clerkId: string,
    public readonly body: CreateDentalPatientBody,
  ) {}
}

export interface CreateDentalPatientResponse {
  personId: string;
  patientNumber: string;
  createdPerson: boolean;
  createdPatient: boolean;
  createdAffiliation: boolean;
}
