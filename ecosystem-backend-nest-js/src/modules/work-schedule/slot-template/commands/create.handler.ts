import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import { CreateCommand } from './create.command';

@CommandHandler(CreateCommand)
export class CreateHandler implements ICommandHandler<CreateCommand, void> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: CreateCommand): Promise<void> {
    const { clerkId, param, body } = command;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    await this.prisma.workScheduleSlotTemplate.create({
      data: {
        workSchedulePositionId: param.position_id,
        slotTypeId: body.slot_type_id,

        name: body.name,
        startTime: body.start_time,
        durationMinute: body.duration_minute,
      },
      select: {
        id: true,
      },
    });
  }
}
