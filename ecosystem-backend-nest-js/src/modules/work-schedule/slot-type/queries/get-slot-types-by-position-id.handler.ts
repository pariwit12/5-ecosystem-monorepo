import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  GetSlotTypesByPositionIdQuery,
  GetSlotTypesByPositionIdResponse,
} from './get-slot-types-by-position-id.query';

@QueryHandler(GetSlotTypesByPositionIdQuery)
export class GetSlotTypesByPositionIdHandler implements IQueryHandler<
  GetSlotTypesByPositionIdQuery,
  GetSlotTypesByPositionIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetSlotTypesByPositionIdQuery,
  ): Promise<GetSlotTypesByPositionIdResponse> {
    const { clerkId, param } = query;

    await this.accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin(
      clerkId,
      param.position_id,
    );

    const slotTypes = await this.prisma.workScheduleSlotType.findMany({
      where: {
        positionId: param.position_id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: [{ id: 'asc' }],
    });

    return {
      slotTypes: slotTypes.map((slotType) => ({
        id: slotType.id,
        name: slotType.name,
      })),
    };
  }
}
