import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';

import { GetSlotByIdQuery, GetSlotByIdResponse } from './get-slot-by-id.query';

@QueryHandler(GetSlotByIdQuery)
export class GetSlotByIdHandler implements IQueryHandler<
  GetSlotByIdQuery,
  GetSlotByIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(query: GetSlotByIdQuery): Promise<GetSlotByIdResponse> {
    const { clerkId, param } = query;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const slot = await this.prisma.workScheduleSlot.findFirst({
      where: {
        id: param.slot_id,
        positionId: param.position_id,
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
    });

    if (!slot) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND,
        'ไม่พบรายการเวรในระบบ หรือรายการเวรไม่ได้อยู่ในตำแหน่งงานนี้',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      id: slot.id,
      staffId: slot.staffId,
      staffName: slot.staffPosition.workScheduleStaff.name,
      slotTypeId: slot.slotTypeId,
      slotTypeName: slot.slotType.name,
      actualStartTime: slot.actualStartTime.toISOString(),
      actualEndTime: slot.actualEndTime.toISOString(),
    };
  }
}
