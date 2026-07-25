import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import { CreateManyCommand } from './create-many.command';

@CommandHandler(CreateManyCommand)
export class CreateManyHandler implements ICommandHandler<
  CreateManyCommand,
  void
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: CreateManyCommand): Promise<void> {
    const { clerkId, param, body } = command;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const dataToInsert = body.staff_ids.map((staffId) => ({
      workScheduleStaffId: staffId,
      workSchedulePositionId: param.position_id,
    }));

    await this.prisma.workScheduleStaffPosition.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });
  }
}
