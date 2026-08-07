import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  GetMinMaxsByPositionIdStartTimeEndTimeQuery,
  GetMinMaxsByPositionIdStartTimeEndTimeResponse,
} from './get-min-maxs-by-position-id-start-time-end-time.query';

@QueryHandler(GetMinMaxsByPositionIdStartTimeEndTimeQuery)
export class GetMinMaxsByPositionIdStartTimeEndTimeHandler implements IQueryHandler<
  GetMinMaxsByPositionIdStartTimeEndTimeQuery,
  GetMinMaxsByPositionIdStartTimeEndTimeResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetMinMaxsByPositionIdStartTimeEndTimeQuery,
  ): Promise<GetMinMaxsByPositionIdStartTimeEndTimeResponse> {
    const { clerkId, param, queryFromUrl } = query;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const minMaxs = await this.prisma.workScheduleMinMax.findMany({
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
    });

    return {
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
