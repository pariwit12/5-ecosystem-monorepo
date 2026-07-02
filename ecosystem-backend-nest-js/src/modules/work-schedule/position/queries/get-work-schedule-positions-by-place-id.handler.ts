import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  GetWorkSchedulePositionsByPlaceIdQuery,
  GetWorkSchedulePositionsByPlaceIdResponse,
} from './get-work-schedule-positions-by-place-id.query';

@QueryHandler(GetWorkSchedulePositionsByPlaceIdQuery)
export class GetWorkSchedulePositionsByPlaceIdHandler implements IQueryHandler<
  GetWorkSchedulePositionsByPlaceIdQuery,
  GetWorkSchedulePositionsByPlaceIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetWorkSchedulePositionsByPlaceIdQuery,
  ): Promise<GetWorkSchedulePositionsByPlaceIdResponse> {
    //
    const { clerkId, param } = query;

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
    // FindMany
    // ============================

    const positions = await this.prisma.workSchedulePosition.findMany({
      where: {
        deletedAt: null,
        organizationWorkSchedulePlaceId: param.place_id,
      },
      select: {
        id: true,
        name: true,
      },
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
      positions: positions.map((p) => ({
        id: p.id,
        name: p.name,
      })),
    };

    // =====================================================================
    // 📨 (จบ) จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type GetTemplateResponse)
    // =====================================================================
  }
}
