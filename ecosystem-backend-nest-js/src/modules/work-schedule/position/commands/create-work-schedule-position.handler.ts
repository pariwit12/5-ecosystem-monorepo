import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import { CreateWorkSchedulePositionCommand } from './create-work-schedule-position.command';

@CommandHandler(CreateWorkSchedulePositionCommand)
export class CreateWorkSchedulePositionHandler implements ICommandHandler<CreateWorkSchedulePositionCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(command: CreateWorkSchedulePositionCommand): Promise<void> {
    const {
      clerkId,
      param,
      body,
      //
    } = command;

    // ===========================
    // ตรวจสอบ AccessControl
    // ===========================

    const {
      //
      // ปรับตามใช้งานจริง
      // eslint-disable-next-line
      personId,
      //
    } = await this.accessControlService.verifyWorkScheduleAdminAccess(
      clerkId,
      param.place_id,
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

    await this.prisma.workSchedulePosition.create({
      data: {
        organizationWorkSchedulePlaceId: param.place_id,
        name: body.name,
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

    // ========================================================================
    // 📨 จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type MethodTemplateResponse)
    // ========================================================================

    // ========================================================================
    // 📨 (จบ) จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type MethodTemplateResponse)
    // ========================================================================
  }
}
