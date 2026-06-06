import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTemplateQuery, GetTemplateResponse } from './get-[template].query';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';

import { AppException } from '../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';
import { HttpStatus } from '@nestjs/common';

@QueryHandler(GetTemplateQuery)
export class GetTemplateHandler implements IQueryHandler<
  GetTemplateQuery,
  GetTemplateResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(query: GetTemplateQuery): Promise<GetTemplateResponse> {
    // eslint-disable-next-line
    const { clerkId, param, queryFromUrl } = query;

    // ตรวจสอบ AccessControl (ปรับตามจริง)
    // eslint-disable-next-line
    const { personId, personOrganizationAffiliationId } =
      await this.accessControlService.verifyOrganizationAccess(
        clerkId,
        param.organization_id,
      );

    // โค้ด prisma ตาม logic ของ API (ปรับตามจริง)
    const organization = await this.prisma.organization.findFirst({
      where: {
        id: param.organization_id,
      },
      select: {
        id: true,
        name: true,
        deletedAt: true,
        organizationDentalClinic: true,
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
            subscriptionEndDate:
              organization.organizationDentalClinic.subscriptionEndDate,
          }
        : null,
    };
  }
}

// อย่าลืมไปลงทะเบียน ใน [template].module.ts
