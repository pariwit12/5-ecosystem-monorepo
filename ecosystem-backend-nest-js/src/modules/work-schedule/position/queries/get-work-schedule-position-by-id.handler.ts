import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { HttpStatus } from '@nestjs/common';

import {
  GetWorkSchedulePositionByIdQuery,
  GetWorkSchedulePositionByIdResponse,
} from './get-work-schedule-position-by-id.query';

@QueryHandler(GetWorkSchedulePositionByIdQuery)
export class GetWorkSchedulePositionByIdHandler implements IQueryHandler<
  GetWorkSchedulePositionByIdQuery,
  GetWorkSchedulePositionByIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetWorkSchedulePositionByIdQuery,
  ): Promise<GetWorkSchedulePositionByIdResponse> {
    const { clerkId, param } = query;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const workSchedulePosition =
      await this.prisma.workSchedulePosition.findFirst({
        where: {
          id: param.position_id,
          deletedAt: null,
        },
        select: {
          name: true,
          organizationWorkSchedulePlaceId: true,
        },
      });

    if (!workSchedulePosition) {
      //
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND,
        'WorkSchedulePositionId นี้ไม่มีในตาราง WorkSchedulePosition',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      name: workSchedulePosition.name,
      placeId: workSchedulePosition.organizationWorkSchedulePlaceId,
    };
  }
}
