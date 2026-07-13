import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import { CreateWorkScheduleSlotTemplateCommand } from './create-work-schedule-slot-template.command';

@CommandHandler(CreateWorkScheduleSlotTemplateCommand)
export class CreateWorkScheduleSlotTemplateHandler implements ICommandHandler<
  CreateWorkScheduleSlotTemplateCommand,
  void
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: CreateWorkScheduleSlotTemplateCommand): Promise<void> {
    const { clerkId, param, body } = command;

    // ===========================
    // ตรวจสอบ AccessControl
    // ===========================

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.work_schedule_position_id,
    );

    // ===========================
    // (จบ) ตรวจสอบ AccessControl
    // ===========================

    // =====================================================================
    // Main Logic ของ API
    // =====================================================================

    // ============================
    // Create
    // ============================

    await this.prisma.workScheduleSlotTemplate.create({
      data: {
        workSchedulePositionId: param.work_schedule_position_id,
        name: body.name,
        startTime: body.start_time,
        durationMinute: body.duration_minute,
        quantity: body.quantity,
      },
      select: {
        id: true,
      },
    });

    // ============================
    // (จบ) Create
    // ============================

    // =====================================================================
    // (จบ) Main Logic ของ API
    // =====================================================================
  }
}
