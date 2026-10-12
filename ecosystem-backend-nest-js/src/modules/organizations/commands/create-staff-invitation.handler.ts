import { randomBytes, createHash } from 'node:crypto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStaffInvitationCommand } from './create-staff-invitation.command';

@CommandHandler(CreateStaffInvitationCommand)
export class CreateStaffInvitationHandler implements ICommandHandler<
  CreateStaffInvitationCommand,
  { code: string; expiresAt: Date }
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateStaffInvitationCommand) {
    const { clerkId, organizationId, clinicId, body } = command;
    const clinic = await this.prisma.organizationDentalClinic.findFirst({
      where: { id: clinicId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!clinic) throw new NotFoundException('ไม่พบคลินิกในองค์กรนี้');

    const account = await this.prisma.userAccount.findUnique({
      where: { clerkId },
      select: {
        person: {
          select: {
            id: true,
            personOrganizationAffiliations: {
              where: { organizationId, role: 'ADMIN' },
              select: { organizationId: true },
            },
            staff: {
              select: {
                clinicAffiliations: {
                  where: {
                    organizationDentalClinicId: clinicId,
                    role: 'ADMIN',
                  },
                  select: { personStaffId: true },
                },
              },
            },
          },
        },
      },
    });
    const person = account?.person;
    const canInvite =
      person &&
      (person.personOrganizationAffiliations.length > 0 ||
        Boolean(person.staff?.clinicAffiliations.length));
    if (!person || !canInvite)
      throw new ForbiddenException('ไม่มีสิทธิ์เชิญพนักงานเข้าคลินิกนี้');
    const createdByPersonId = person.id;

    let targetPersonId: string | undefined;
    if (body.cid) {
      const person = await this.prisma.person.upsert({
        where: { cid: body.cid },
        update: {},
        create: {
          cid: body.cid,
          firstName: body.firstName,
          lastName: body.lastName,
        },
        select: { id: true },
      });
      targetPersonId = person.id;
    }

    const code = randomBytes(18).toString('base64url');
    const codeHash = createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.staffInvitation.create({
      data: {
        codeHash,
        organizationDentalClinicId: clinicId,
        role: body.role,
        targetPersonId,
        createdByPersonId,
        expiresAt,
      },
    });

    return { code, expiresAt };
  }
}
