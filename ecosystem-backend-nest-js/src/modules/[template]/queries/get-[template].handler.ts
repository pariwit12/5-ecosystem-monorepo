import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

// ปรับตามใช้งานจริง
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
    const { personId } =
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

    const organizations = await this.prisma.organization.findMany({
      where: {
        // organizationId: param.organization_id,
        deletedAt: null,
        personOrganizationAffiliations: {
          some: {
            personId: personId,
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // ==========================================
    // 🚀 3. THE PRISMA MAGIC (Parallel Execution)
    // ==========================================
    // ใช้ Promise.all เพื่อยิง 2 คำสั่งเข้าไปหา Database พร้อมๆ กัน (ประหยัดเวลาลงครึ่งนึง!)
    // eslint-disable-next-line
    const [placesAsAdmin, placesAsStaff] = await Promise.all([
      // ก้อนที่ 1: ค้นหาสถานที่ที่คนๆ นี้เป็น "Admin"
      this.prisma.organizationWorkSchedulePlace.findMany({
        where: {
          deletedAt: null,
          workScheduleAdmins: {
            some: {
              personId: personId,
              deletedAt: null,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      }),

      // ก้อนที่ 2: ค้นหาสถานที่ที่คนๆ นี้เป็น "Staff"
      this.prisma.organizationWorkSchedulePlace.findMany({
        where: {
          deletedAt: null,
          workScheduleStaffs: {
            some: {
              personId: personId,
              deletedAt: null,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    // ==========================================
    // 📨 4. ส่งข้อมูลกลับไปให้ Frontend
    // ==========================================
    // return {
    //   placesAsAdmin: placesAsAdmin.map((place) => ({
    //     id: place.id,
    //     name: place.name,
    //   })),
    //   placesAsStaff: placesAsStaff.map((place) => ({
    //     id: place.id,
    //     name: place.name,
    //   })),
    // };

    return {
      id: organization.id,
      name: organization.name,
      // ตัวอย่างการ map ข้อมูลจาก findMany
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
      })),
    };
  }
}

// อย่าลืมไปลงทะเบียน ใน [template].module.ts
