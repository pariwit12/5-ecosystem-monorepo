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
    // Create (Batch)
    // ============================

    // 🌟 1. ประกอบร่างข้อมูล Array ให้พร้อมสำหรับ Prisma
    const slotsToInsert = body.slots.map((slot) => ({
      workSchedulePositionId: param.work_schedule_position_id,
      name: slot.name,
      actualStartTime: slot.actual_start_time,
      actualEndTime: slot.actual_end_time,
    }));

    // 🌟 2. ใช้ createMany ยิงเข้า Database ในคราวเดียว (เร็วและไม่เปลือง Connection)
    await this.prisma.workScheduleSlot.createMany({
      data: slotsToInsert,
      // skipDuplicates: false, // ถ้าอยากให้มันข้ามตัวที่ซ้ำกัน (ต้องมี @@unique index รองรับ) สามารถเปิดใช้ได้ครับ
    });

    // หมายเหตุ: createMany จะไม่สามารถ select { id: true } กลับมาได้เหมือน create ปกติ
    // แต่มันมักจะไม่เป็นปัญหาเพราะ API นี้เป็น Command (CQRS) ที่ return void อยู่แล้วครับ

    // ============================
    // (จบ) Create (Batch)
    // ============================

    // =====================================================================
    // (จบ) Main Logic ของ API
    // =====================================================================
  }
}
