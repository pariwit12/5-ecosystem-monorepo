import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  GetStaffPositionsByPositionIdQuery,
  GetStaffPositionsByPositionIdResponse,
} from './get-staff-positions-by-position-id.query';

@QueryHandler(GetStaffPositionsByPositionIdQuery)
export class GetStaffPositionsByPositionIdHandler implements IQueryHandler<
  GetStaffPositionsByPositionIdQuery,
  GetStaffPositionsByPositionIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetStaffPositionsByPositionIdQuery,
  ): Promise<GetStaffPositionsByPositionIdResponse> {
    const { clerkId, param } = query;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const staffPositions = await this.prisma.workScheduleStaffPosition.findMany(
      {
        where: {
          workSchedulePositionId: param.position_id,
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

    return {
      staffPositions: staffPositions.map((sp) => ({
        staffId: sp.workScheduleStaffId,
        name: sp.workScheduleStaff.name,
      })),
    };
  }
}
