import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  GetWorkScheduleStaffByPlaceIdQuery,
  GetWorkScheduleStaffByPlaceIdResponse,
} from './get-work-schedule-staff-by-place-id.query';

import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

@QueryHandler(GetWorkScheduleStaffByPlaceIdQuery)
export class GetWorkScheduleStaffByPlaceIdHandler implements IQueryHandler<
  GetWorkScheduleStaffByPlaceIdQuery,
  GetWorkScheduleStaffByPlaceIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetWorkScheduleStaffByPlaceIdQuery,
  ): Promise<GetWorkScheduleStaffByPlaceIdResponse> {
    const { clerkId, param } = query;

    // ตรวจสอบ AccessControl
    // eslint-disable-next-line
    const { personId } =
      await this.accessControlService.verifyWorkScheduleAdminAccess(
        clerkId,
        param.place_id,
      );

    const workScheduleStaffs = await this.prisma.workScheduleStaff.findMany({
      where: {
        organizationWorkSchedulePlaceId: param.place_id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return {
      workScheduleStaffs: workScheduleStaffs.map((wss) => ({
        id: wss.id,
        name: wss.name,
      })),
    };
  }
}
