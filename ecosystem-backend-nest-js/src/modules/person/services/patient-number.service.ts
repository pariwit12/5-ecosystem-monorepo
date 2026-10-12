import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PatientNumberService {
  constructor(private readonly prisma: PrismaService) {}

  async allocateNext(organizationDentalClinicId: string): Promise<string> {
    return this.prisma.$transaction((tx) =>
      this.allocateNextInTransaction(tx, organizationDentalClinicId),
    );
  }

  async allocateNextInTransaction(
    tx: Prisma.TransactionClient | PrismaClient,
    organizationDentalClinicId: string,
  ): Promise<string> {
    const sequence = await tx.patientNumberSequence.upsert({
      where: { organizationDentalClinicId },
      create: { organizationDentalClinicId, nextNumber: 2 },
      update: { nextNumber: { increment: 1 } },
      select: { nextNumber: true },
    });

    const allocatedNumber = sequence.nextNumber - 1;
    return String(allocatedNumber);
  }
}
