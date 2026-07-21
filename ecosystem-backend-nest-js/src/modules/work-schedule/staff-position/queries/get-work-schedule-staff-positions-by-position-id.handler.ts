import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  GetWorkScheduleStaffPositionsByPositionIdQuery,
  GetWorkScheduleStaffPositionsByPositionIdResponse,
} from './get-work-schedule-staff-positions-by-position-id.query';

@QueryHandler(GetWorkScheduleStaffPositionsByPositionIdQuery)
export class GetWorkScheduleStaffPositionsByPositionIdHandler implements IQueryHandler<
  GetWorkScheduleStaffPositionsByPositionIdQuery,
  GetWorkScheduleStaffPositionsByPositionIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetWorkScheduleStaffPositionsByPositionIdQuery,
  ): Promise<GetWorkScheduleStaffPositionsByPositionIdResponse> {
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

    const staffPositions = await this.prisma.workScheduleStaffPosition.findMany(
      {
        where: {
          workSchedulePositionId: param.work_schedule_position_id,
          deletedAt: null,
        },
        select: {
          workScheduleStaffId: true,
          workScheduleStaff: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ workScheduleStaffId: 'asc' }],
      },
    );

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
      staffPositions: staffPositions.map((sp) => ({
        workScheduleStaffId: sp.workScheduleStaffId,
        name: sp.workScheduleStaff.name,
      })),
    };

    // =====================================================================
    // 📨 (จบ) จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type GetTemplateResponse)
    // =====================================================================
  }
}
