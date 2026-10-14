import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateDentalPatientBodySchema = z
  .object({
    version: z.number().int().min(1),
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    nickname: z.string().trim().min(1).nullable().optional(),
    phone: z.string().trim().min(1).nullable().optional(),
    birthDate: z
      .preprocess(
        (value) => (value === null ? null : value),
        z.coerce.date().nullable(),
      )
      .optional(),
  })
  .strict()
  .refine(
    (body) =>
      body.firstName !== undefined ||
      body.lastName !== undefined ||
      body.nickname !== undefined ||
      body.phone !== undefined ||
      body.birthDate !== undefined,
    { message: 'ต้องระบุข้อมูลที่ต้องการแก้ไขอย่างน้อยหนึ่งรายการ' },
  );

export class UpdateDentalPatientBody extends createZodDto(
  UpdateDentalPatientBodySchema,
) {}

export class UpdateDentalPatientCommand {
  constructor(
    public readonly clerkId: string,
    public readonly personId: string,
    public readonly organizationDentalClinicId: string,
    public readonly body: UpdateDentalPatientBody,
  ) {}
}

export interface UpdateDentalPatientResponse {
  personId: string;
  version: number;
}
