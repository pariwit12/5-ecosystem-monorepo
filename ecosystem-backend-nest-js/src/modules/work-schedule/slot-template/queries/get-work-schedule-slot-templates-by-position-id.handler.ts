import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  GetWorkScheduleSlotTemplatesByPositionIdQuery,
  GetWorkScheduleSlotTemplatesByPositionIdResponse,
} from './get-work-schedule-slot-templates-by-position-id.query';

@QueryHandler(GetWorkScheduleSlotTemplatesByPositionIdQuery)
export class GetWorkScheduleSlotTemplatesByPositionIdHandler implements IQueryHandler<
  GetWorkScheduleSlotTemplatesByPositionIdQuery,
  GetWorkScheduleSlotTemplatesByPositionIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetWorkScheduleSlotTemplatesByPositionIdQuery,
  ): Promise<GetWorkScheduleSlotTemplatesByPositionIdResponse> {
    const { clerkId, param } = query;

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
    // FindMany
    // ============================

    const slotTemplates = await this.prisma.workScheduleSlotTemplate.findMany({
      where: {
        workSchedulePositionId: param.work_schedule_position_id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: [{ id: 'asc' }],
    });

    // ============================
    // (จบ) FindMany
    // ============================

    // =====================================================================
    // (จบ) Main Logic ของ API
    // =====================================================================

    // =====================================================================
    // 📨 จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type GetTemplateResponse)
    // =====================================================================

    return {
      slotTemplates: slotTemplates.map((st) => ({
        id: st.id,
        name: st.name,
      })),
    };

    // =====================================================================
    // 📨 (จบ) จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type GetTemplateResponse)
    // =====================================================================
  }
}
