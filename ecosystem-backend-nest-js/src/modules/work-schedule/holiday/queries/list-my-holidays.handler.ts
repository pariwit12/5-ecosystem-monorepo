import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ListMyHolidaysQuery,
  ListMyHolidaysResponse,
} from './list-my-holidays.query';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

@Injectable()
@QueryHandler(ListMyHolidaysQuery)
export class ListMyHolidaysHandler implements IQueryHandler<
  ListMyHolidaysQuery,
  ListMyHolidaysResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(query: ListMyHolidaysQuery): Promise<ListMyHolidaysResponse> {
    const { clerkId, param } = query;
    const placeId = param.place_id;

    const { staffId } =
      await this.accessControlService.verifyWorkScheduleStaffAccess(
        clerkId,
        placeId,
      );

    const holidays = await this.prisma.workScheduleHoliday.findMany({
      where: {
        workScheduleStaffId: staffId,
      },
      orderBy: {
        startTime: 'asc',
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        createdAt: true,
      },
    });

    return {
      holidays: holidays.map((h) => ({
        id: h.id,
        startTime: h.startTime.toISOString(),
        endTime: h.endTime.toISOString(),
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }
}
