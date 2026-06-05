import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTemplateQuery, GetTemplateResponse } from './get-[template].query';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';

// import Exception ที่ต้องการใช้ (ถ้ามี)
import { NotFoundException } from '@nestjs/common';

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

    // ดักจับ Error ที่ทำให้โปรแกรมพัง (ถึงเราจะตรวจสอบและเตรียมข้อมูลใน guard ไว้บ้างแล้ว)
    if (!organization) {
      throw new NotFoundException('ไม่พบองค์กร');
    }

    if (organization.deletedAt !== null) {
      throw new NotFoundException('องค์กรนี้ถูกลบไปแล้ว');
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
