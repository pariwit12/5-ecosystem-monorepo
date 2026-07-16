import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { HttpStatus } from '@nestjs/common';

import {
  GetWorkScheduleSlotTemplateByIdQuery,
  GetWorkScheduleSlotTemplateByIdResponse,
} from './get-work-schedule-slot-template-by-id.query';

@QueryHandler(GetWorkScheduleSlotTemplateByIdQuery)
export class GetWorkScheduleSlotTemplateByIdHandler implements IQueryHandler<
  GetWorkScheduleSlotTemplateByIdQuery,
  GetWorkScheduleSlotTemplateByIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetWorkScheduleSlotTemplateByIdQuery,
  ): Promise<GetWorkScheduleSlotTemplateByIdResponse> {
    const { clerkId, param } = query;

    // ===========================
    // ตรวจสอบ AccessControl
    // ===========================

    await this.accessControlService.verifyWorkScheduleSlotTemplateIdByWorkScheduleAdmin(
      clerkId,
      param.work_schedule_slot_template_id,
    );

    // ===========================
    // (จบ) ตรวจสอบ AccessControl
    // ===========================

    // =====================================================================
    // Main Logic ของ API
    // =====================================================================

    // ============================
    // FindFirst / FindUnique
    // ============================

    const workScheduleSlotTemplate =
      await this.prisma.workScheduleSlotTemplate.findFirst({
        where: {
          id: param.work_schedule_slot_template_id,
        },
        select: {
          name: true,
          startTime: true,
          durationMinute: true,
          quantity: true,
        },
      });

    // --------------------------------------------------
    // --------- สำหรับ findFirst หรือ findUnique ---------

    if (!workScheduleSlotTemplate) {
      //
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_SLOT_TEMPLATE_NOT_FOUND,
        'WorkScheduleSlotTemplateId นี้ไม่มีในตาราง WorkScheduleSlotTemplate',
        HttpStatus.NOT_FOUND,
      );
    }

    // --------------------------------------------------

    // ============================
    // (จบ) FindFirst / FindUnique
    // ============================

    // =====================================================================
    // (จบ) Main Logic ของ API
    // =====================================================================

    // =====================================================================
    // 📨 จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type GetTemplateResponse)
    // =====================================================================

    return {
      name: workScheduleSlotTemplate.name,
      startTime: workScheduleSlotTemplate.startTime,
      durationMinute: workScheduleSlotTemplate.durationMinute,
      quantity: workScheduleSlotTemplate.quantity,
    };

    // =====================================================================
    // 📨 (จบ) จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type GetTemplateResponse)
    // =====================================================================
  }
}
