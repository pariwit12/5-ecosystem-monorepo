import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import { CreateWorkScheduleSlotCommand } from './create-work-schedule-slot.command';

@CommandHandler(CreateWorkScheduleSlotCommand)
export class CreateWorkScheduleSlotHandler implements ICommandHandler<
  CreateWorkScheduleSlotCommand,
  void
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: CreateWorkScheduleSlotCommand): Promise<void> {
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
    // CreateMany (Batch)
    // ============================

    const slotsToInsert = body.slots.map((slot) => ({
      workSchedulePositionId: param.work_schedule_position_id,
      name: slot.name,
      actualStartTime: slot.actual_start_time,
      actualEndTime: slot.actual_end_time,
    }));

    await this.prisma.workScheduleSlot.createMany({
      data: slotsToInsert,
    });

    // ============================
    // (จบ) CreateMany (Batch)
    // ============================

    // =====================================================================
    // (จบ) Main Logic ของ API
    // =====================================================================
  }
}
