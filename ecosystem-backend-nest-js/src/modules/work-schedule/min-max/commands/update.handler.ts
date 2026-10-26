import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { UpdateCommand } from './update.command';

@CommandHandler(UpdateCommand)
export class UpdateHandler implements ICommandHandler<UpdateCommand, void> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: UpdateCommand): Promise<void> {
    const { clerkId, param, body } = command;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "work_schedule_position" WHERE id = ${param.position_id} FOR UPDATE`;

      const existing = await tx.workScheduleMinMax.findFirst({
        where: {
          id: param.min_max_id,
          workSchedulePositionId: param.position_id,
        },
        select: { id: true },
      });

      if (!existing) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND,
          'ไม่พบรายการ min/max ในระบบ หรือรายการไม่ได้อยู่ในตำแหน่งงานนี้',
          HttpStatus.NOT_FOUND,
        );
      }

      const overlap = await tx.workScheduleMinMax.findFirst({
        where: {
          id: { not: param.min_max_id },
          workSchedulePositionId: param.position_id,
          startTime: { lt: body.end_time },
          endTime: { gt: body.start_time },
        },
        select: { startTime: true, endTime: true },
      });

      if (overlap) {
        throw new BadRequestException(
          `ไม่สามารถบันทึกได้ เนื่องจากมีข้อมูลทับซ้อนในช่วงเวลา ${overlap.startTime.toISOString()} - ${overlap.endTime.toISOString()} `,
        );
      }

      await tx.workScheduleMinMax.update({
        where: {
          id: param.min_max_id,
          workSchedulePositionId: param.position_id,
        },
        data: {
          min: body.min,
          max: body.max,
          startTime: body.start_time,
          endTime: body.end_time,
        },
        select: { id: true },
      });
    });
  }
}
