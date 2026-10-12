import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';
import { CreateDentalClinicCommand } from './create-dental-clinic.command';

@CommandHandler(CreateDentalClinicCommand)
export class CreateDentalClinicHandler implements ICommandHandler<
  CreateDentalClinicCommand,
  { id: string }
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: CreateDentalClinicCommand): Promise<{ id: string }> {
    const { clerkId, organizationId, body } = command;
    await this.accessControlService.verifyOrganizationAdmin(
      clerkId,
      organizationId,
    );

    return this.prisma.organizationDentalClinic.create({
      data: {
        organizationId,
        name: body.name,
        licenseNumber: body.licenseNumber,
        timezone: body.timezone,
      },
      select: { id: true },
    });
  }
}
