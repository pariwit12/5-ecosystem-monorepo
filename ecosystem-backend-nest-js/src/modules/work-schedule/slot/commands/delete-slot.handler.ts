import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { DeleteSlotCommand } from './delete-slot.command';

@CommandHandler(DeleteSlotCommand)
export class DeleteSlotHandler implements ICommandHandler<
  DeleteSlotCommand,
  void
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: DeleteSlotCommand): Promise<void> {
    const { clerkId, param } = command;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const result = await this.prisma.workScheduleSlot.deleteMany({
      where: {
        id: param.slot_id,
        positionId: param.position_id,
      },
    });

    if (result.count === 0) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND,
        'ไม่พบรายการเวรในระบบ หรือรายการเวรไม่ได้อยู่ในตำแหน่งงานนี้',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
