import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import {
  GetOrganizationByIdQuery,
  GetOrganizationByIdResponse,
} from './get-organization-by-id.query';
import { PrismaService } from '../../../prisma/prisma.service';

// 🌟 ระบุว่า Handler ตัวนี้รับผิดชอบออเดอร์ GetOrganizationByIdQuery นะ
@QueryHandler(GetOrganizationByIdQuery)
export class GetOrganizationByIdHandler implements IQueryHandler<
  GetOrganizationByIdQuery,
  GetOrganizationByIdResponse
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetOrganizationByIdQuery,
  ): Promise<GetOrganizationByIdResponse> {
    const {
      // clerkId,
      // personId,
      // personOrganizationAffiliationId,
      organizationId,
    } = query;

    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        organizationDentalClinic: {
          select: {
            id: true,
            paymentStatus: true,
            subscriptionEndDate: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('ไม่พบข้อมูลองค์กร กรุณาลองใหม่อีกครั้ง');
    }

    return {
      id: organization.id,
      name: organization.name,
      organizationDentalClinic: organization.organizationDentalClinic
        ? {
            id: organization.organizationDentalClinic.id,
            paymentStatus: organization.organizationDentalClinic.paymentStatus,
            subscriptionEndDate:
              organization.organizationDentalClinic.subscriptionEndDate,
          }
        : null,
    };
  }
}
