import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { HttpStatus } from '@nestjs/common';
import {
  GetStaffPlaceQuery,
  GetStaffPlaceResponse,
} from './get-staff-place.query';

@QueryHandler(GetStaffPlaceQuery)
export class GetStaffPlaceHandler implements IQueryHandler<
  GetStaffPlaceQuery,
  GetStaffPlaceResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(query: GetStaffPlaceQuery): Promise<GetStaffPlaceResponse> {
    const { clerkId, param } = query;

    const { staffId } =
      await this.accessControlService.verifyWorkScheduleStaffAccess(
        clerkId,
        param.place_id,
      );

    const place = await this.prisma.organizationWorkSchedulePlace.findUnique({
      where: {
        id: param.place_id,
      },
      select: {
        id: true,
        name: true,
        timezone: true,
        deletedAt: true,
      },
    });

    if (!place || place.deletedAt !== null) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
        'ไม่พบสถานที่ทำงานหรือสถานที่ถูกลบแล้ว',
        HttpStatus.NOT_FOUND,
      );
    }

    const staff = await this.prisma.workScheduleStaff.findUnique({
      where: {
        id: staffId,
      },
      select: {
        id: true,
        name: true,
        deletedAt: true,
      },
    });

    if (!staff || staff.deletedAt !== null) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_STAFF_NOT_FOUND,
        'ไม่พบข้อมูลพนักงานหรือพนักงานถูกลบแล้ว',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      placeId: place.id,
      name: place.name,
      timezone: place.timezone,
      staff: {
        id: staff.id,
        name: staff.name,
      },
    };
  }
}
