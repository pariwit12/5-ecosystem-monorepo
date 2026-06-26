import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/error-codes.enum';

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
      throw new AppException(
        ErrorCode.PERSON_NOT_FOUND,
        'ClerkId นี้ไม่มีในตาราง Person',
        HttpStatus.NOT_FOUND,
      );
    }

    return { personId: person.id };
  }

  // ==========================================
  // 🏢 ด่านตรวจสอบระดับ ORGANIZATION
  // ==========================================
  async verifyOrganizationAccess(clerkId: string, organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    // 1. เช็คตัวตน
    if (!organization) {
      throw new AppException(
        ErrorCode.ORGANIZATION_NOT_FOUND,
        'OrganizationId นี้ไม่มีในตาราง Organization',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. เช็คว่าองค์กรโดนลบไปหรือยัง
    if (organization.deletedAt !== null) {
      throw new AppException(
        ErrorCode.ORGANIZATION_DELETED,
        'OrganizationId นี้มีข้อมูล deletedAt แล้ว',
        HttpStatus.FORBIDDEN,
      );
    }

    const person = await this.prisma.person.findUnique({
      where: { clerkId: clerkId },
      select: {
        id: true,
        personOrganizationAffiliations: {
          where: { organizationId: organizationId },
          select: {
            organizationId: true,
          },
        },
      },
    });

    // 1. เช็คตัวตน
    if (!person) {
      throw new AppException(
        ErrorCode.PERSON_NOT_FOUND,
        'ClerkId นี้ไม่มีในตาราง Person',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. เช็คความสัมพันธ์กับองค์กร
    if (
      !person.personOrganizationAffiliations ||
      person.personOrganizationAffiliations.length === 0
    ) {
      throw new AppException(
        ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
        'PersonId นี้ไม่มี PersonOrganizationAffiliation ที่เชื่อมกับ OrganizationId นี้',
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      personId: person.id,
    };
  }

  // =====================================================================================
  // โปรแกรม Work-Schedule
  // =====================================================================================

  // ==========================================
  // 🏢 ด่านตรวจสอบ สิทธิ์ workScheduleAdmin
  // ==========================================
  async verifyWorkScheduleAdminAccess(clerkId: string, placeId: string) {
    const organizationWorkSchedulePlace =
      await this.prisma.organizationWorkSchedulePlace.findUnique({
        where: { id: placeId },
        select: {
          id: true,
          deletedAt: true,
        },
      });

    // 1. เช็คตัวตน
    if (!organizationWorkSchedulePlace) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
        'OrganizationWorkSchedulePlaceId นี้ไม่มีในตาราง OrganizationWorkSchedulePlace',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. เช็คว่าองค์กรโดนลบไปหรือยัง
    if (organizationWorkSchedulePlace.deletedAt !== null) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
        'OrganizationWorkSchedulePlaceId นี้มีข้อมูล deletedAt แล้ว',
        HttpStatus.FORBIDDEN,
      );
    }

    const person = await this.prisma.person.findUnique({
      where: { clerkId: clerkId },
      select: {
        id: true,
        workScheduleAdmins: {
          where: { organizationWorkSchedulePlaceId: placeId, deletedAt: null },
          select: {
            organizationWorkSchedulePlaceId: true,
          },
        },
      },
    });

    // 1. เช็คตัวตน
    if (!person) {
      throw new AppException(
        ErrorCode.PERSON_NOT_FOUND,
        'ClerkId นี้ไม่มีในตาราง Person',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. เช็คความเป็น Admin
    if (!person.workScheduleAdmins || person.workScheduleAdmins.length === 0) {
      throw new AppException(
        // ปรับ
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        'PersonId นี้ไม่มี WorkScheduleAdmin ที่เชื่อมกับ OrganizationWorkSchedulePlaceId นี้',
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      personId: person.id,
    };
  }
}
