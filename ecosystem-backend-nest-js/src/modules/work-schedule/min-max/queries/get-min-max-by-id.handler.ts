import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import {
  GetMinMaxByIdQuery,
  GetMinMaxByIdResponse,
} from './get-min-max-by-id.query';

@QueryHandler(GetMinMaxByIdQuery)
export class GetMinMaxByIdHandler implements IQueryHandler<
  GetMinMaxByIdQuery,
  GetMinMaxByIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(query: GetMinMaxByIdQuery): Promise<GetMinMaxByIdResponse> {
    const { clerkId, param } = query;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const minMax = await this.prisma.workScheduleMinMax.findFirst({
      where: {
        id: param.min_max_id,
        workSchedulePositionId: param.position_id,
      },
      select: {
        id: true,
        min: true,
        max: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!minMax) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND,
        'ไม่พบรายการ min/max ในระบบ หรือรายการไม่ได้อยู่ในตำแหน่งงานนี้',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      id: minMax.id,
      min: minMax.min,
      max: minMax.max,
      startTime: minMax.startTime.toISOString(),
      endTime: minMax.endTime.toISOString(),
    };
  }
}
