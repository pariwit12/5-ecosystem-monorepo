import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  GetMyWorkScheduleSlotsQuery,
  GetMyWorkScheduleSlotsResponse,
} from './get-my-work-schedule-slots.query';

@QueryHandler(GetMyWorkScheduleSlotsQuery)
export class GetMyWorkScheduleSlotsHandler implements IQueryHandler<
  GetMyWorkScheduleSlotsQuery,
  GetMyWorkScheduleSlotsResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetMyWorkScheduleSlotsQuery,
  ): Promise<GetMyWorkScheduleSlotsResponse> {
    const { staffId } =
      await this.accessControlService.verifyWorkScheduleStaffAccess(
        query.clerkId,
        query.param.place_id,
      );

    const workScheduleSlots = await this.prisma.workScheduleSlot.findMany({
      where: {
        staffId,
        actualStartTime: { lt: query.queryFromUrl.end_time },
        actualEndTime: { gt: query.queryFromUrl.start_time },
      },
      select: {
        id: true,
        slotType: { select: { name: true } },
        actualStartTime: true,
        actualEndTime: true,
      },
      orderBy: [{ actualStartTime: 'asc' }, { actualEndTime: 'asc' }],
    });

    return {
      workScheduleSlots: workScheduleSlots.map((slot) => ({
        id: slot.id,
        slotTypeName: slot.slotType.name,
        actualStartTime: slot.actualStartTime.toISOString(),
        actualEndTime: slot.actualEndTime.toISOString(),
      })),
    };
  }
}
