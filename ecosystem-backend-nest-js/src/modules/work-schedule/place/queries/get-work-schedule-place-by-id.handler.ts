import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { HttpStatus } from '@nestjs/common';

import {
  GetWorkSchedulePlaceByIdQuery,
  GetWorkSchedulePlaceByIdResponse,
} from './get-work-schedule-place-by-id.query';

@QueryHandler(GetWorkSchedulePlaceByIdQuery)
export class GetWorkSchedulePlaceByIdHandler implements IQueryHandler<
  GetWorkSchedulePlaceByIdQuery,
  GetWorkSchedulePlaceByIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetWorkSchedulePlaceByIdQuery,
  ): Promise<GetWorkSchedulePlaceByIdResponse> {
    const { clerkId, param } = query;

    // ===========================
    // ตรวจสอบ AccessControl
    // ===========================

    await this.accessControlService.verifyWorkScheduleAdminAccess(
      clerkId,
      param.work_schedule_place_id,
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

    const workSchedulePlace =
      await this.prisma.organizationWorkSchedulePlace.findFirst({
        where: {
          id: param.work_schedule_place_id,
          deletedAt: null,
        },
        select: {
          timezone: true,
          name: true,
        },
      });

    if (!workSchedulePlace) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_PLACE_DELETED,

        'PlaceId นี้ไม่มีในตาราง OrganizationWorkSchedulePlace',

        HttpStatus.FORBIDDEN,
      );
    }

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
      timezone: workSchedulePlace.timezone,
      name: workSchedulePlace.name,
    };

    // =====================================================================
    // 📨 (จบ) จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type GetTemplateResponse)
    // =====================================================================
  }
}
