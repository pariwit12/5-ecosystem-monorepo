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
    // Create
    // ============================

    await this.prisma.workScheduleSlot.create({
      data: {
        workSchedulePositionId: param.work_schedule_position_id,
        name: body.name,
        actualStartTime: body.actual_start_time,
        actualEndTime: body.actual_end_time,
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

// อย่าลืมไปลงทะเบียน ใน [template].module.ts
