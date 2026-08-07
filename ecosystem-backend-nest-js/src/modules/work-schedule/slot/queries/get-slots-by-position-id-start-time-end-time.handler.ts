import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  GetSlotsByPositionIdStartTimeEndTimeQuery,
  GetSlotsByPositionIdStartTimeEndTimeResponse,
} from './get-slots-by-position-id-start-time-end-time.query';

@QueryHandler(GetSlotsByPositionIdStartTimeEndTimeQuery)
export class GetSlotsByPositionIdStartTimeEndTimeHandler implements IQueryHandler<
  GetSlotsByPositionIdStartTimeEndTimeQuery,
  GetSlotsByPositionIdStartTimeEndTimeResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetSlotsByPositionIdStartTimeEndTimeQuery,
  ): Promise<GetSlotsByPositionIdStartTimeEndTimeResponse> {
    const { clerkId, param, queryFromUrl } = query;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const [workScheduleSlots, minMaxs] = await Promise.all([
      this.prisma.workScheduleSlot.findMany({
        where: {
          positionId: param.position_id,

          // DB startTime ต้องเกิดก่อนเวลาสิ้นสุดที่ส่งมา
          actualStartTime: {
            lt: queryFromUrl.end_time,
          },
          // DB endTime ต้องเกิดหลังเวลาเริ่มต้นที่ส่งมา
          actualEndTime: {
            gt: queryFromUrl.start_time,
          },
        },
        select: {
          id: true,
          staffId: true,
          staffPosition: {
            select: {
              workScheduleStaff: {
                select: {
                  name: true,
                },
              },
            },
          },
          slotTypeId: true,
          slotType: {
            select: {
              name: true,
            },
          },
          actualStartTime: true,
          actualEndTime: true,
        },
        orderBy: [{ actualStartTime: 'asc' }, { actualEndTime: 'asc' }],
      }),

      this.prisma.workScheduleMinMax.findMany({
        where: {
          workSchedulePositionId: param.position_id,

          // DB startTime ต้องเกิดก่อนเวลาสิ้นสุดที่ส่งมา
          startTime: {
            lt: queryFromUrl.end_time,
          },
          // DB endTime ต้องเกิดหลังเวลาเริ่มต้นที่ส่งมา
          endTime: {
            gt: queryFromUrl.start_time,
          },
        },
        select: {
          id: true,
          min: true,
          max: true,
          startTime: true,
          endTime: true,
        },
        orderBy: [{ startTime: 'asc' }, { endTime: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return {
      workScheduleSlots: workScheduleSlots.map((slot) => ({
        id: slot.id,
        staffId: slot.staffId,
        staffName: slot.staffPosition.workScheduleStaff.name,
        slotTypeId: slot.slotTypeId,
        slotTypeName: slot.slotType.name,
        actualStartTime: slot.actualStartTime.toISOString(),
        actualEndTime: slot.actualEndTime.toISOString(),
      })),

      minMaxs: minMaxs.map((mm) => ({
        id: mm.id,
        min: mm.min,
        max: mm.max,
        startTime: mm.startTime.toISOString(),
        endTime: mm.endTime.toISOString(),
      })),
    };
  }
}
