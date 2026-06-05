import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccessControlService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // 👤 ด่านตรวจสอบระดับ PERSON
  // ==========================================
  async verifyPerson(clerkId: string) {
    const person = await this.prisma.person.findUnique({
      where: { clerkId },
      select: {
        id: true,
      },
    });

    if (!person) {
      throw new ForbiddenException({
        errorCode: 'PERSON_NOT_FOUND',
        message:
          'ไม่พบข้อมูลโปรไฟล์ผู้ใช้งานในระบบ กรุณาลงทะเบียนโปรไฟล์ก่อนเข้าใช้งาน',
      });
    }

    return { personId: person.id };
  }

  // ==========================================
  // 🏢 ด่านตรวจสอบระดับ ORGANIZATION
  // ==========================================
  async verifyOrganizationAccess(clerkId: string, organizationId: string) {
    // *** Note ***
    // อนาคตถ้าอยากได้ error ที่ละเอียดขึ้น อาจต้องตรวจ organizationId ก่อน ซึ่งตอนนั้นเดี๋ยวใช้ Redis เข้ามาช่วย แล้วค่อยแยก query

    const person = await this.prisma.person.findUnique({
      where: { clerkId: clerkId },
      select: {
        id: true,
        personOrganizationAffiliations: {
          where: { organizationId: organizationId },
          select: {
            id: true,
            organization: {
              select: {
                id: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    // 1. เช็คตัวตน
    if (!person) {
      throw new ForbiddenException({
        errorCode: 'PERSON_NOT_FOUND',
        message: 'ไม่พบข้อมูลโปรไฟล์ กรุณาลงทะเบียนโปรไฟล์ก่อนเข้าใช้งาน',
      });
    }

    // 2. เช็คความสัมพันธ์กับองค์กร
    if (
      !person.personOrganizationAffiliations ||
      person.personOrganizationAffiliations.length === 0
    ) {
      throw new ForbiddenException({
        errorCode: 'NOT_ORGANIZATION_MEMBER or ORGANIZATION_NOT_FOUND',
        message: 'คุณไม่มีสิทธิ์เข้าถึง หรือไม่พบองค์กรนี้',
      });
    }

    // 3. เช็คว่าองค์กรโดนลบไปหรือยัง
    if (
      person.personOrganizationAffiliations[0].organization.deletedAt !== null
    ) {
      throw new ForbiddenException({
        errorCode: 'ORGANIZATION_DELETED',
        message: 'องค์กรนี้ถูกลบออกจากระบบแล้ว',
      });
    }

    return {
      personId: person.id,
      personOrganizationAffiliationId:
        person.personOrganizationAffiliations[0].id,
    };
  }
}
