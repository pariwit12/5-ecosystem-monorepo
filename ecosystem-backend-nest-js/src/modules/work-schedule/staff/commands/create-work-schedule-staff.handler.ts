import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateWorkScheduleStaffCommand } from './create-work-schedule-staff.command';

import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

@CommandHandler(CreateWorkScheduleStaffCommand)
export class CreateWorkScheduleStaffHandler implements ICommandHandler<
  CreateWorkScheduleStaffCommand,
  void
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: CreateWorkScheduleStaffCommand): Promise<void> {
    const { clerkId, param, body } = command;

    // eslint-disable-next-line
    const { personId } =
      await this.accessControlService.verifyWorkScheduleAdminAccess(
        clerkId,
        param.place_id,
      );

    // eslint-disable-next-line
    const newWorkScheduleStaff = await this.prisma.workScheduleStaff.create({
      data: {
        organizationWorkSchedulePlaceId: param.place_id,
        name: body.name,
      },
    });
  }
}
