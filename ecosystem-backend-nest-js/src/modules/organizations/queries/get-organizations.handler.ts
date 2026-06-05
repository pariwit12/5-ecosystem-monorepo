import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetOrganizationsQuery,
  GetOrganizationsResponse,
} from './get-organizations.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';

@QueryHandler(GetOrganizationsQuery)
export class GetOrganizationsHandler implements IQueryHandler<
  GetOrganizationsQuery,
  GetOrganizationsResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetOrganizationsQuery,
  ): Promise<GetOrganizationsResponse> {
    const { clerkId } = query;

    const { personId } = await this.accessControlService.verifyPerson(clerkId);

    const organizations = await this.prisma.organization.findMany({
      where: {
        deletedAt: null,
        personOrganizationAffiliations: {
          some: {
            personId: personId,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      organizations: organizations,
    };
  }
}
