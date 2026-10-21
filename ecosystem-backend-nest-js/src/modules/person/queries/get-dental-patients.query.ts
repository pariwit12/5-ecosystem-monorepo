import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetDentalPatientsQuerySchema = z.object({
  organizationDentalClinicId: z.string().uuid(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export class GetDentalPatientsDtoQuery extends createZodDto(
  GetDentalPatientsQuerySchema,
) {}

export class GetDentalPatientsQuery {
  constructor(
    public readonly clerkId: string,
    public readonly query: GetDentalPatientsDtoQuery,
  ) {}
}

export interface DentalPatientListItem {
  personId: string;
  patientNumber: string;
  firstName: string | null;
  lastName: string | null;
  nickname?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
}

export interface GetDentalPatientsResponse {
  patients: DentalPatientListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
