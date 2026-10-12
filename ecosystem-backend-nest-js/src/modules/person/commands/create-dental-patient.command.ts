import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateDentalPatientBodySchema = z.object({
  organizationDentalClinicId: z.string().uuid(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  cid: z.string().trim().length(13).optional(),
  phone: z.string().trim().min(1).optional(),
  birthDate: z.coerce.date().optional(),
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
