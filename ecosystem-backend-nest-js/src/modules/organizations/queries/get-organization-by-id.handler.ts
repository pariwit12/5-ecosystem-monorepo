import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GetOrganizationByIdQuery,
  GetOrganizationByIdResponse,
} from './get-organization-by-id.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';

import { AppException } from '../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';
import { HttpStatus } from '@nestjs/common';

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

    // ต้องตรวจ เพราะ TS จะบ่น (เพราะเป็น Error ที่ทำให้โปรแกรมพัง) แต่ตามตรรกะเราตรวจแล้ว
    if (!organization) {
      throw new AppException(
        ErrorCode.ORGANIZATION_NOT_FOUND,
        'OrganizationId นี้ไม่มีในตาราง Organization',
        HttpStatus.NOT_FOUND,
      );
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
