import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  GetWorkScheduleSlotsByPositionIdQuery,
  GetWorkScheduleSlotsByPositionIdResponse,
} from './get-work-schedule-slots-by-position-id.query';

@QueryHandler(GetWorkScheduleSlotsByPositionIdQuery)
export class GetWorkScheduleSlotsByPositionIdHandler implements IQueryHandler<
  //
  GetWorkScheduleSlotsByPositionIdQuery,
  GetWorkScheduleSlotsByPositionIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetWorkScheduleSlotsByPositionIdQuery,
  ): Promise<GetWorkScheduleSlotsByPositionIdResponse> {
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
    } =
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

    const workScheduleSlots = await this.prisma.workScheduleSlot.findMany({
      where: {
        workSchedulePositionId: param.work_schedule_position_id,
      },
      select: {
        id: true,
        workScheduleStaffId: true,
        workScheduleStaffPosition: {
          select: {
            workScheduleStaff: {
              select: {
                name: true,
              },
            },
          },
        },
        name: true,
        actualStartTime: true,
        actualEndTime: true,
      },
      orderBy: [
        { actualStartTime: 'asc' },
        { actualEndTime: 'asc' },
        { name: 'asc' },
      ],
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
      workScheduleSlots: workScheduleSlots.map((slot) => ({
        id: slot.id,
        workScheduleStaffId: slot.workScheduleStaffId,
        workScheduleStaffName:
          slot.workScheduleStaffPosition?.workScheduleStaff.name || null,
        name: slot.name,
        actualStartTime: slot.actualStartTime.toISOString(),
        actualEndTime: slot.actualEndTime.toISOString(),
      })),
    };

    // =====================================================================
    // 📨 (จบ) จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type GetTemplateResponse)
    // =====================================================================
  }
}
