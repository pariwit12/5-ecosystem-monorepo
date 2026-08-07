import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  GetSlotTemplatesByPositionIdQuery,
  GetSlotTemplatesByPositionIdResponse,
} from './get-slot-templates-by-position-id.query';

@QueryHandler(GetSlotTemplatesByPositionIdQuery)
export class GetSlotTemplatesByPositionIdHandler implements IQueryHandler<
  GetSlotTemplatesByPositionIdQuery,
  GetSlotTemplatesByPositionIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetSlotTemplatesByPositionIdQuery,
  ): Promise<GetSlotTemplatesByPositionIdResponse> {
    const { clerkId, param } = query;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const slotTemplates = await this.prisma.workScheduleSlotTemplate.findMany({
      where: {
        workSchedulePositionId: param.position_id,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: [{ id: 'asc' }],
    });

    return {
      slotTemplates: slotTemplates.map((st) => ({
        id: st.id,
        name: st.name,
      })),
    };
  }
}
