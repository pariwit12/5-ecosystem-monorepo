import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTemplateQuery, GetTemplateResponse } from './get-[template].query';
import { PrismaService } from '../../../prisma/prisma.service';

// import Exception ที่ต้องการใช้ (ถ้ามี)
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetTemplateQuery)
export class GetTemplateHandler implements IQueryHandler<
  GetTemplateQuery,
  GetTemplateResponse
> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTemplateQuery): Promise<GetTemplateResponse> {
    const {
      // eslint-disable-next-line
      clerkId,
      // eslint-disable-next-line
      personId,
      // eslint-disable-next-line
      personOrganizationAffiliationId,
      organizationId,
    } = query;

    // โค้ด prisma ตาม logic ของ API
    //

    // 🌟 ดึงข้อมูลและ Join ตารางให้จบในคราวเดียว
    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
      },
      include: {
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
            paymentStatus: organization.organizationDentalClinic.paymentStatus,
            subscriptionEndDate:
              organization.organizationDentalClinic.subscriptionEndDate,
          }
        : null,
    };
  }
}
