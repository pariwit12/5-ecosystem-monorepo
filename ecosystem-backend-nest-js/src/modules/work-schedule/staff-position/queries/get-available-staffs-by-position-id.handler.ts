import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  GetAvailableStaffsByPositionIdQuery,
  GetAvailableStaffsByPositionIdResponse,
} from './get-available-staffs-by-position-id.query';

@QueryHandler(GetAvailableStaffsByPositionIdQuery)
export class GetAvailableStaffsByPositionIdHandler implements IQueryHandler<
  GetAvailableStaffsByPositionIdQuery,
  GetAvailableStaffsByPositionIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetAvailableStaffsByPositionIdQuery,
  ): Promise<GetAvailableStaffsByPositionIdResponse> {
    const { clerkId, param } = query;

    const { organizationWorkSchedulePlaceId } =
      await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
        clerkId,
        param.position_id,
      );

    const staffs = await this.prisma.workScheduleStaff.findMany({
      where: {
        organizationWorkSchedulePlaceId: organizationWorkSchedulePlaceId,
        workScheduleStaffPositions: {
          none: {
            workSchedulePositionId: param.position_id,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: [{ id: 'asc' }],
    });

    return {
      availableStaffs: staffs.map((staff) => ({
        id: staff.id,
        name: staff.name,
      })),
    };
  }
}
