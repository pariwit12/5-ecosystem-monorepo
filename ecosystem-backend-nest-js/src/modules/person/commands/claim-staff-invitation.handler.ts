import { createHash } from 'node:crypto';
import {
  ConflictException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ClaimStaffInvitationCommand } from './claim-staff-invitation.command';

@CommandHandler(ClaimStaffInvitationCommand)
export class ClaimStaffInvitationHandler implements ICommandHandler<
  ClaimStaffInvitationCommand,
  { organizationDentalClinicId: string; role: string }
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    command: ClaimStaffInvitationCommand,
    attempt = 0,
  ): Promise<{ organizationDentalClinicId: string; role: string }> {
    const codeHash = createHash('sha256').update(command.code).digest('hex');

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const invitation = await tx.staffInvitation.findUnique({
            where: { codeHash },
          });
          if (!invitation) throw new NotFoundException('ไม่พบรหัสเชิญ');
          if (invitation.usedAt)
            throw new ConflictException('รหัสเชิญถูกใช้แล้ว');
          if (invitation.expiresAt <= new Date())
            throw new GoneException('รหัสเชิญหมดอายุแล้ว');

          const currentPerson = await tx.person.findUnique({
            where: { clerkId: command.clerkId },
          });
          if (!currentPerson)
            throw new NotFoundException('ไม่พบข้อมูลผู้ใช้งาน');

          let personId = currentPerson.id;
          if (
            invitation.targetPersonId &&
            invitation.targetPersonId !== currentPerson.id
          ) {
            const target = await tx.person.findUnique({
              where: { id: invitation.targetPersonId },
            });
            if (!target) throw new NotFoundException('ไม่พบบุคคลที่ถูกเชิญ');
            if (target.clerkId && target.clerkId !== command.clerkId)
              throw new ConflictException('บุคคลนี้เชื่อมกับบัญชีอื่นแล้ว');
            if (
              currentPerson.firstName ||
              currentPerson.lastName ||
              currentPerson.cid ||
              currentPerson.phone ||
              currentPerson.birthDate
            ) {
              throw new ConflictException(
                'บัญชีปัจจุบันมีข้อมูลบุคคลแล้ว ไม่สามารถเชื่อมอัตโนมัติได้',
              );
            }

            await tx.person.update({
              where: { id: currentPerson.id },
              data: { clerkId: null },
            });
            await tx.person.update({
              where: { id: target.id },
              data: { clerkId: command.clerkId },
            });
            await tx.person.delete({ where: { id: currentPerson.id } });
            personId = target.id;
          }

          await tx.personStaff.upsert({
            where: { personId },
            create: { personId },
            update: {},
          });
          await tx.personStaffAffiliation.upsert({
            where: {
              personStaffId_organizationDentalClinicId: {
                personStaffId: personId,
                organizationDentalClinicId:
                  invitation.organizationDentalClinicId,
              },
            },
            create: {
              personStaffId: personId,
              organizationDentalClinicId: invitation.organizationDentalClinicId,
              role: invitation.role,
            },
            update: { role: invitation.role },
          });

          const claimed = await tx.staffInvitation.updateMany({
            where: {
              id: invitation.id,
              usedAt: null,
              expiresAt: { gt: new Date() },
            },
            data: { usedAt: new Date(), usedByPersonId: personId },
          });
          if (claimed.count !== 1)
            throw new ConflictException('รหัสเชิญไม่สามารถใช้งานได้แล้ว');

          return {
            organizationDentalClinicId: invitation.organizationDentalClinicId,
            role: invitation.role,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        attempt < 3 &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        return this.execute(command, attempt + 1);
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'บัญชีปัจจุบันมีข้อมูลที่ไม่สามารถรวมอัตโนมัติได้',
        );
      }
      throw error;
    }
  }
}
