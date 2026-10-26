import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { DeleteCommand } from './delete.command';

@CommandHandler(DeleteCommand)
export class DeleteHandler implements ICommandHandler<DeleteCommand, void> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: DeleteCommand): Promise<void> {
    const { clerkId, param } = command;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const result = await this.prisma.workScheduleMinMax.deleteMany({
      where: {
        id: param.min_max_id,
        workSchedulePositionId: param.position_id,
      },
    });

    if (result.count === 0) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND,
        'ไม่พบรายการ min/max ในระบบ หรือรายการไม่ได้อยู่ในตำแหน่งงานนี้',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
