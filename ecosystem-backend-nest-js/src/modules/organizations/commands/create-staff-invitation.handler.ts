import { randomBytes, createHash } from 'node:crypto';
import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';
import { CreateStaffInvitationCommand } from './create-staff-invitation.command';

@CommandHandler(CreateStaffInvitationCommand)
export class CreateStaffInvitationHandler implements ICommandHandler<
  CreateStaffInvitationCommand,
  { code: string; expiresAt: Date }
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: CreateStaffInvitationCommand) {
    const { clerkId, organizationId, clinicId, body } = command;
    const { personId: createdByPersonId } =
      await this.accessControlService.verifyOrganizationAdmin(
        clerkId,
        organizationId,
      );

    const clinic = await this.prisma.organizationDentalClinic.findFirst({
      where: { id: clinicId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!clinic) throw new NotFoundException('ไม่พบคลินิกในองค์กรนี้');

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
