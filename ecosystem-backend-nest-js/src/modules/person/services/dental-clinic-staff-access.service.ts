import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export type PatientAccessRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'RECEPTIONIST'
  | 'DENTIST'
  | 'DENTAL_ASSISTANT'
  | 'ACCOUNTING'
  | 'OTHER';

@Injectable()
export class DentalClinicStaffAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async verify(
    clerkId: string,
    organizationDentalClinicId: string,
  ): Promise<{ role: PatientAccessRole }> {
    const account = await this.prisma.userAccount.findUnique({
      where: { clerkId },
      select: {
        person: {
          select: {
            staff: {
              select: {
                clinicAffiliations: {
                  where: {
                    organizationDentalClinicId,
                    organizationDentalClinic: {
                      deletedAt: null,
                      organization: { deletedAt: null },
                    },
                  },
                  select: { role: true },
                  take: 1,
                },
              },
            },
            dentist: {
              select: {
                clinicAffiliations: {
                  where: {
                    organizationDentalClinicId,
                    organizationDentalClinic: {
                      deletedAt: null,
                      organization: { deletedAt: null },
                    },
                  },
                  select: { personDentistId: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    const person = account?.person;
    const staffAffiliation = person?.staff?.clinicAffiliations[0];
    if (staffAffiliation) {
      return { role: staffAffiliation.role };
    }

    const dentistAffiliation = person?.dentist?.clinicAffiliations[0];
    if (dentistAffiliation) {
      return { role: 'DENTIST' };
    }

    throw new ForbiddenException('ต้องมีสิทธิ์เข้าถึงคลินิกนี้');
  }
}
