import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateDentalClinicBodySchema = z.object({
  name: z.string().trim().min(1),
  licenseNumber: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).default('Asia/Bangkok'),
});

export class CreateDentalClinicBody extends createZodDto(
  CreateDentalClinicBodySchema,
) {}

export class CreateDentalClinicCommand {
  constructor(
    public readonly clerkId: string,
    public readonly organizationId: string,
    public readonly body: CreateDentalClinicBody,
  ) {}
}
