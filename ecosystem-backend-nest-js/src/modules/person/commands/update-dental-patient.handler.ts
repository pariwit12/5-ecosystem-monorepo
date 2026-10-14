import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { DentalClinicStaffAccessService } from '../services/dental-clinic-staff-access.service';
import {
  UpdateDentalPatientCommand,
  UpdateDentalPatientResponse,
} from './update-dental-patient.command';

@CommandHandler(UpdateDentalPatientCommand)
export class UpdateDentalPatientHandler implements ICommandHandler<
  UpdateDentalPatientCommand,
  UpdateDentalPatientResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAccess: DentalClinicStaffAccessService,
  ) {}

  async execute(
    command: UpdateDentalPatientCommand,
  ): Promise<UpdateDentalPatientResponse> {
    const { role } = await this.staffAccess.verify(
      command.clerkId,
      command.organizationDentalClinicId,
    );

    const { version, ...profile } = command.body;
    const fields = Object.keys(profile);
    const receptionistFields = new Set([
      'firstName',
      'lastName',
      'nickname',
      'phone',
    ]);

    if (
      role !== 'ADMIN' &&
      (role !== 'RECEPTIONIST' ||
        fields.some((field) => !receptionistFields.has(field)))
    ) {
      throw new ForbiddenException('ไม่มีสิทธิ์แก้ไขข้อมูลคนไข้');
    }

    const affiliation =
      await this.prisma.personDentalPatientAffiliation.findUnique({
        where: {
          personDentalPatientId_organizationDentalClinicId: {
            personDentalPatientId: command.personId,
            organizationDentalClinicId: command.organizationDentalClinicId,
          },
        },
        select: { personDentalPatientId: true },
      });
    if (!affiliation) throw new NotFoundException('ไม่พบคนไข้ในคลินิกนี้');

    const updated = await this.prisma.person.updateMany({
      where: { id: command.personId, version },
      data: { ...profile, version: { increment: 1 } },
    });

    if (updated.count !== 1) {
      throw new ConflictException(
        'ข้อมูลคนไข้ถูกแก้ไขโดยผู้ใช้อื่น กรุณาโหลดข้อมูลใหม่',
      );
    }

    return { personId: command.personId, version: version + 1 };
  }
}
