import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateWorkSchedulePlaceCommand } from './create-work-schedule-place.command';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

@CommandHandler(CreateWorkSchedulePlaceCommand)
export class CreateWorkSchedulePlaceHandler implements ICommandHandler<CreateWorkSchedulePlaceCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: CreateWorkSchedulePlaceCommand): Promise<void> {
    const { clerkId, param, body } = command;

    await this.accessControlService.verifyOrganizationAccess(
      clerkId,
      param.organization_id,
    );

    await this.prisma.organizationWorkSchedulePlace.create({
      data: {
        organizationId: param.organization_id,
        timezone: body.timezone,
        name: body.name,
      },
    });
  }
}
