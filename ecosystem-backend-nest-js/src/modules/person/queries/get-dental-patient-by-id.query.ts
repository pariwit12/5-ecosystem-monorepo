import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetDentalPatientByIdParamSchema = z.object({
  person_id: z.string().uuid(),
});

export class GetDentalPatientByIdDtoParam extends createZodDto(
  GetDentalPatientByIdParamSchema,
) {}

export const GetDentalPatientByIdQuerySchema = z.object({
  organizationDentalClinicId: z.string().uuid(),
});

export class GetDentalPatientByIdDtoQuery extends createZodDto(
  GetDentalPatientByIdQuerySchema,
) {}

export class GetDentalPatientByIdQuery {
  constructor(
    public readonly clerkId: string,
    public readonly personId: string,
    public readonly organizationDentalClinicId: string,
  ) {}
}

export interface GetDentalPatientByIdResponse {
  personId: string;
  patientNumber: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  phone: string | null;
  cid: string | null;
  birthDate: Date | null;
}
