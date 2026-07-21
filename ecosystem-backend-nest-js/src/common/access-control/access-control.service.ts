import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/error-codes.enum';

@Injectable()
export class AccessControlService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // 👤 ด่านตรวจสอบ Person
  // ==========================================

  // 1
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
  // 👤 (จบ) ด่านตรวจสอบ Person
  // ==========================================

  // =====================================================================
  // 🏢 ด่านตรวจสอบ Organization + สิทธิ PersonOrganizationAffiliation
  // =====================================================================

  // 2
  async verifyOrganizationAccess(clerkId: string, organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
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

  // =====================================================================
  // 🏢 (จบ) ด่านตรวจสอบ Organization + สิทธิ PersonOrganizationAffiliation
  // =====================================================================

  // =====================================================================================
  // โปรแกรม Work-Schedule
  // =====================================================================================

  // ==============================================================
  // 🏢 ด่านตรวจสอบ WorkSchedulePlace + สิทธิ WorkScheduleAdmin
  // ==============================================================

  // 3
  async verifyWorkScheduleAdminAccess(clerkId: string, placeId: string) {
    const organizationWorkSchedulePlace =
      await this.prisma.organizationWorkSchedulePlace.findUnique({
        where: { id: placeId },
        select: {
          deletedAt: true,
        },
      });

    // 1
    if (!organizationWorkSchedulePlace) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
        'OrganizationWorkSchedulePlaceId นี้ไม่มีในตาราง OrganizationWorkSchedulePlace',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2
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
            deletedAt: true,
          },
        },
      },
    });

    // 3
    if (!person) {
      throw new AppException(
        ErrorCode.PERSON_NOT_FOUND,
        'ClerkId นี้ไม่มีในตาราง Person',
        HttpStatus.NOT_FOUND,
      );
    }

    // 4
    if (!person.workScheduleAdmins || person.workScheduleAdmins.length === 0) {
      throw new AppException(
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        'PersonId นี้ไม่มี WorkScheduleAdmin ที่เชื่อมกับ OrganizationWorkSchedulePlaceId นี้',
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      personId: person.id,
    };
  }

  // ==============================================================
  // 🏢 (จบ) ด่านตรวจสอบ WorkSchedulePlace + สิทธิ WorkScheduleAdmin
  // ==============================================================

  // =================================================================
  // 🌟 ด่านตรวจสอบ WorkSchedulePosition + สิทธิ WorkScheduleAdmin
  // =================================================================

  // 4
  async verifyWorkSchedulePositionByWorkScheduleAdmin(
    clerkId: string,
    positionId: string,
  ) {
    const workSchedulePosition =
      await this.prisma.workSchedulePosition.findUnique({
        where: { id: positionId },
        select: {
          deletedAt: true,
          organizationWorkSchedulePlace: {
            select: {
              id: true,
              deletedAt: true,
            },
          },
        },
      });

    // 1
    if (!workSchedulePosition) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND,
        'WorkSchedulePositionId นี้ไม่มีในตาราง WorkSchedulePosition',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2
    if (workSchedulePosition.deletedAt !== null) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
        'WorkSchedulePositionId นี้มีข้อมูล deletedAt แล้ว',
        HttpStatus.FORBIDDEN,
      );
    }

    // 3
    if (workSchedulePosition.organizationWorkSchedulePlace.deletedAt !== null) {
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
          where: {
            organizationWorkSchedulePlaceId:
              workSchedulePosition.organizationWorkSchedulePlace.id,
            deletedAt: null,
          },
          select: {
            deletedAt: true,
          },
        },
      },
    });

    // 4
    if (!person) {
      throw new AppException(
        ErrorCode.PERSON_NOT_FOUND,
        'ClerkId นี้ไม่มีในตาราง Person',
        HttpStatus.NOT_FOUND,
      );
    }

    // 5
    if (!person.workScheduleAdmins || person.workScheduleAdmins.length === 0) {
      throw new AppException(
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        'PersonId นี้ไม่มี WorkScheduleAdmin ที่เชื่อมกับ OrganizationWorkSchedulePlaceId นี้',
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      personId: person.id,
      organizationWorkSchedulePlaceId:
        workSchedulePosition.organizationWorkSchedulePlace.id,
    };
  }

  // =================================================================
  // 🌟 (จบ) ด่านตรวจสอบ WorkSchedulePosition + สิทธิ WorkScheduleAdmin
  // =================================================================

  // =================================================================
  // 🌟 ตรวจสอบ WorkScheduleSlotTemplateId + สิทธิ WorkScheduleAdmin
  // =================================================================

  // 5
  async verifyWorkScheduleSlotTemplateIdByWorkScheduleAdmin(
    clerkId: string,
    slotTemplateId: string,
  ) {
    const workScheduleSlotTemplate =
      await this.prisma.workScheduleSlotTemplate.findUnique({
        where: { id: slotTemplateId },
        select: {
          workSchedulePosition: {
            select: {
              deletedAt: true,
              organizationWorkSchedulePlace: {
                select: {
                  id: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
      });

    // 1
    if (!workScheduleSlotTemplate) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_SLOT_TEMPLATE_NOT_FOUND,
        'WorkScheduleSlotTemplateId นี้ไม่มีในตาราง WorkScheduleSlotTemplate',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2
    if (workScheduleSlotTemplate.workSchedulePosition.deletedAt !== null) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
        'WorkSchedulePositionId นี้มีข้อมูล deletedAt แล้ว',
        HttpStatus.FORBIDDEN,
      );
    }

    // 3
    if (
      workScheduleSlotTemplate.workSchedulePosition
        .organizationWorkSchedulePlace.deletedAt !== null
    ) {
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
          where: {
            organizationWorkSchedulePlaceId:
              workScheduleSlotTemplate.workSchedulePosition
                .organizationWorkSchedulePlace.id,
            deletedAt: null,
          },
          select: {
            deletedAt: true,
          },
        },
      },
    });

    // 4
    if (!person) {
      throw new AppException(
        ErrorCode.PERSON_NOT_FOUND,
        'ClerkId นี้ไม่มีในตาราง Person',
        HttpStatus.NOT_FOUND,
      );
    }

    // 5
    if (!person.workScheduleAdmins || person.workScheduleAdmins.length === 0) {
      throw new AppException(
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        'PersonId นี้ไม่มี WorkScheduleAdmin ที่เชื่อมกับ OrganizationWorkSchedulePlaceId นี้',
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      personId: person.id,
      organizationWorkSchedulePlaceId:
        workScheduleSlotTemplate.workSchedulePosition
          .organizationWorkSchedulePlace.id,
    };
  }

  // =================================================================
  // 🌟 (จบ) ด่านตรวจสอบ WorkSchedulePosition + สิทธิ WorkScheduleAdmin
  // =================================================================

  // =====================================================================================
  // (จบ) โปรแกรม Work-Schedule
  // =====================================================================================
  //
}
