import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class DentalClinicStaffAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async verify(clerkId: string, organizationDentalClinicId: string) {
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
          },
        },
      },
    });

    const affiliation = account?.person?.staff?.clinicAffiliations[0];
    if (!affiliation) {
      throw new ForbiddenException('ต้องเป็นพนักงานของคลินิกนี้');
    }

    return { role: affiliation.role };
  }
}
