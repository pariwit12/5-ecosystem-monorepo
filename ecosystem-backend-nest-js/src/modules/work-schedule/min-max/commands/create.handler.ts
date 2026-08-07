import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import { CreateCommand } from './create.command';

import { BadRequestException } from '@nestjs/common';

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

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "work_schedule_position" WHERE id = ${param.position_id} FOR UPDATE`;

      const minMax = await tx.workScheduleMinMax.findFirst({
        where: {
          workSchedulePositionId: param.position_id,
          startTime: {
            lt: body.end_time,
          },
          endTime: {
            gt: body.start_time,
          },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      });

      if (minMax) {
        throw new BadRequestException(
          `ไม่สามารถบันทึกได้ เนื่องจากมีข้อมูลทับซ้อนในช่วงเวลา ${minMax.startTime.toISOString()} - ${minMax.endTime.toISOString()} `,
        );
      }

      await tx.workScheduleMinMax.create({
        data: {
          workSchedulePositionId: param.position_id,
          min: body.min,
          max: body.max,
          startTime: body.start_time,
          endTime: body.end_time,
        },
        select: {
          id: true,
        },
      });
    });
  }
}
