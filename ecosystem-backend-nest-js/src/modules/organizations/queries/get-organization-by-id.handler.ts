import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetOrganizationByIdQuery,
  GetOrganizationByIdResponse,
} from './get-organization-by-id.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';

import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetOrganizationByIdQuery)
export class GetOrganizationByIdHandler implements IQueryHandler<
  GetOrganizationByIdQuery,
  GetOrganizationByIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetOrganizationByIdQuery,
  ): Promise<GetOrganizationByIdResponse> {
    const { clerkId, param } = query;

    await this.accessControlService.verifyOrganizationAccess(
      clerkId,
      param.organization_id,
    );

    const organization = await this.prisma.organization.findFirst({
      where: {
        id: param.organization_id,
        deletedAt: null, // ความจริงอาจไม่ต้องตรวจสอบแล้ว เนื่องจากควรตรวจมาจาก accessControlService เรียบร้อยแล้ว
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
      // ต้องตรวจ เพราะ TS จะบ่น แต่ตามตรรกะเราตรวจแล้ว
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
