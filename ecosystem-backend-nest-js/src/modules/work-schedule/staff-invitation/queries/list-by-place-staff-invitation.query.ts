import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ListStaffInvitationsByPlaceParamDtoSchema = z.object({
  place_id: z.uuid({
    version: 'v7',
    message: 'รูปแบบรหัสสถานที่ทำงานไม่ถูกต้อง',
  }),
});

export class ListStaffInvitationsByPlaceParamDto extends createZodDto(
  ListStaffInvitationsByPlaceParamDtoSchema,
) {}

export class ListStaffInvitationsByPlaceQuery {
  constructor(
    public readonly clerkId: string,
    public readonly param: ListStaffInvitationsByPlaceParamDto,
  ) {}
}

export interface ListStaffInvitationsByPlaceResponse {
  invitations: {
    id: string;
    staffId: string;
    staffName: string;
    status:
      | 'ISSUED'
      | 'PENDING'
      | 'APPROVED'
      | 'REJECTED'
      | 'REVOKED'
      | 'EXPIRED';
    expiresAt: string;
    requestedAt: string | null;
    requester: {
      personId: string;
      firstName: string | null;
      lastName: string | null;
      nickname: string | null;
    } | null;
  }[];
}
