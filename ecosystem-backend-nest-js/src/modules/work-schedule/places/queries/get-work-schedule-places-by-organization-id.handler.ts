import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetWorkSchedulePlacesByOrganizationIdQuery,
  GetWorkSchedulePlacesByOrganizationIdResponse,
} from './get-work-schedule-places-by-organization-id.query';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

@QueryHandler(GetWorkSchedulePlacesByOrganizationIdQuery)
export class GetWorkSchedulePlacesByOrganizationIdHandler implements IQueryHandler<
  GetWorkSchedulePlacesByOrganizationIdQuery,
  GetWorkSchedulePlacesByOrganizationIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetWorkSchedulePlacesByOrganizationIdQuery,
  ): Promise<GetWorkSchedulePlacesByOrganizationIdResponse> {
    const { clerkId, param } = query;

    await this.accessControlService.verifyOrganizationAccess(
      clerkId,
      param.organization_id,
    );

    const workSchedulePlaces =
      await this.prisma.organizationWorkSchedulePlace.findMany({
        where: {
          deletedAt: null,
          organizationId: param.organization_id,
        },
        select: {
          id: true,
          name: true,
        },
      });

    return {
      workSchedulePlaces: workSchedulePlaces.map((org) => ({
        id: org.id,
        name: org.name,
      })),
    };
  }
}
