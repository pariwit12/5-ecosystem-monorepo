import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetOrganizationsQuery,
  GetOrganizationsResponse,
} from './get-organizations.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetOrganizationsQuery)
export class GetOrganizationsHandler implements IQueryHandler<
  GetOrganizationsQuery,
  GetOrganizationsResponse
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetOrganizationsQuery,
  ): Promise<GetOrganizationsResponse> {
    const {
      // clerkId,
      personId,
    } = query;

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
