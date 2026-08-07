import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { HttpStatus } from '@nestjs/common';

import {
  GetSlotTemplateByIdQuery,
  GetSlotTemplateByIdResponse,
} from './get-slot-template-by-id.query';

@QueryHandler(GetSlotTemplateByIdQuery)
export class GetSlotTemplateByIdHandler implements IQueryHandler<
  GetSlotTemplateByIdQuery,
  GetSlotTemplateByIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetSlotTemplateByIdQuery,
  ): Promise<GetSlotTemplateByIdResponse> {
    const { clerkId, param } = query;

    await this.accessControlService.verifyWorkScheduleSlotTemplateIdByWorkScheduleAdmin(
      clerkId,
      param.slot_template_id,
    );

    const slotTemplate = await this.prisma.workScheduleSlotTemplate.findFirst({
      where: {
        id: param.slot_template_id,
      },
      select: {
        slotTypeId: true,

        name: true,
        startTime: true,
        durationMinute: true,
      },
    });

    if (!slotTemplate) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_SLOT_TEMPLATE_NOT_FOUND,
        'WorkScheduleSlotTemplateId นี้ไม่มีในตาราง WorkScheduleSlotTemplate',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      slotTypeId: slotTemplate.slotTypeId,

      name: slotTemplate.name,
      startTime: slotTemplate.startTime,
      durationMinute: slotTemplate.durationMinute,
    };
  }
}
