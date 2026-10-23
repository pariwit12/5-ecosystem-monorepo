import { HttpStatus, Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AppException } from '../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';

@Injectable()
export class WorkScheduleStaffInvitationService {
  constructor(private readonly prisma: PrismaService) {}

  public hashToken(token: string): string {
    return createHash('sha256').update(token.trim()).digest('hex');
  }

  public generateCode(): string {
    return randomBytes(18).toString('base64url');
  }

  public getEffectiveStatus(
    status: 'ISSUED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED',
    expiresAt: Date,
    now: Date = new Date(),
  ): 'ISSUED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | 'EXPIRED' {
    if (
      (status === 'ISSUED' || status === 'PENDING') &&
      expiresAt.getTime() <= now.getTime()
    ) {
      return 'EXPIRED';
    }
    return status;
  }

  private async executeWithRetry<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            return await operation(tx);
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error: unknown) {
        if (error instanceof AppException) {
          throw error;
        }

        const prismaError = error as { code?: string };
        if (prismaError?.code === 'P2034') {
          attempt++;
          if (attempt > maxRetries) {
            throw new AppException(
              ErrorCode.WORK_SCHEDULE_INVITATION_CONFLICT,
              'เกิดการแข่งขันในการทำรายการ กรุณาลองใหม่อีกครั้ง',
              HttpStatus.CONFLICT,
            );
          }
          continue;
        }

        if (prismaError?.code === 'P2002') {
          throw new AppException(
            ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
            'ข้อมูลการผูกบัญชีหรือคำเชิญมีความขัดแย้ง',
            HttpStatus.CONFLICT,
          );
        }

        throw error;
      }
    }

    throw new AppException(
      ErrorCode.WORK_SCHEDULE_INVITATION_CONFLICT,
      'เกิดการแข่งขันในการทำรายการ กรุณาลองใหม่อีกครั้ง',
      HttpStatus.CONFLICT,
    );
  }

  // 1. Issue
  async issue(
    clerkId: string,
    placeId: string,
    staffId: string,
  ): Promise<{ invitationId: string; code: string; expiresAt: string }> {
    return this.executeWithRetry(async (tx) => {
      // Re-read actor person within tx
      const account = await tx.userAccount.findUnique({
        where: { clerkId },
        select: { person: { select: { id: true } } },
      });
      if (!account?.person) {
        throw new AppException(
          ErrorCode.PERSON_NOT_FOUND,
          'ไม่พบข้อมูล Person ของผู้ดำเนินการ',
          HttpStatus.NOT_FOUND,
        );
      }
      const actorPersonId = account.person.id;

      // Re-read place & admin within tx
      const place = await tx.organizationWorkSchedulePlace.findUnique({
        where: { id: placeId },
        select: { deletedAt: true },
      });
      if (!place || place.deletedAt !== null) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
          'ไม่พบสถานที่ทำงานหรือสถานที่ถูกลบแล้ว',
          HttpStatus.NOT_FOUND,
        );
      }

      const admin = await tx.workScheduleAdmin.findFirst({
        where: {
          personId: actorPersonId,
          organizationWorkSchedulePlaceId: placeId,
          deletedAt: null,
        },
      });
      if (!admin) {
        throw new AppException(
          ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
          'ผู้ดำเนินการไม่ได้เป็น Admin ของสถานที่นี้',
          HttpStatus.FORBIDDEN,
        );
      }

      // Re-read staff within tx
      const staff = await tx.workScheduleStaff.findUnique({
        where: { id: staffId },
        select: {
          id: true,
          organizationWorkSchedulePlaceId: true,
          personId: true,
          deletedAt: true,
        },
      });
      if (
        !staff ||
        staff.deletedAt !== null ||
        staff.organizationWorkSchedulePlaceId !== placeId
      ) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_NOT_FOUND,
          'ไม่พบพนักงานในสถานที่นี้หรือพนักงานถูกลบแล้ว',
          HttpStatus.NOT_FOUND,
        );
      }

      if (staff.personId !== null) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
          'พนักงานนี้ผูกบัญชีเรียบร้อยแล้ว ไม่สามารถออกรหัสใหม่ได้',
          HttpStatus.CONFLICT,
        );
      }

      const now = new Date();
      // Revoke any existing active or expired ISSUED / PENDING invitations for this staff
      await tx.workScheduleStaffInvitation.updateMany({
        where: {
          staffId,
          status: { in: ['ISSUED', 'PENDING'] },
        },
        data: {
          status: 'REVOKED',
          revokedAt: now,
        },
      });

      // Generate code with bounded collision retry (3 times)
      let code = '';
      let codeHash = '';
      let collisionAttempts = 0;
      while (collisionAttempts < 3) {
        code = this.generateCode();
        codeHash = this.hashToken(code);
        const existing = await tx.workScheduleStaffInvitation.findUnique({
          where: { codeHash },
        });
        if (!existing) {
          break;
        }
        collisionAttempts++;
      }

      if (collisionAttempts >= 3) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_INVITATION_CONFLICT,
          'ไม่สามารถสร้างรหัสคำเชิญได้ กรุณาลองใหม่อีกครั้ง',
          HttpStatus.CONFLICT,
        );
      }

      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const invitation = await tx.workScheduleStaffInvitation.create({
        data: {
          staffId,
          codeHash,
          status: 'ISSUED',
          createdByPersonId: actorPersonId,
          createdAt: now,
          expiresAt,
        },
      });

      return {
        invitationId: invitation.id,
        code,
        expiresAt: expiresAt.toISOString(),
      };
    });
  }

  // 2. Preview
  async preview(
    clerkId: string,
    code: string,
  ): Promise<{
    invitationId: string;
    staffName: string;
    placeName: string;
    expiresAt: string;
  }> {
    // Check person exists
    const account = await this.prisma.userAccount.findUnique({
      where: { clerkId },
      select: { person: { select: { id: true } } },
    });
    if (!account?.person) {
      throw new AppException(
        ErrorCode.PERSON_NOT_FOUND,
        'ไม่พบข้อมูล Person ของคุณ กรุณาลงทะเบียนก่อน',
        HttpStatus.NOT_FOUND,
      );
    }

    const codeHash = this.hashToken(code);
    const invitation = await this.prisma.workScheduleStaffInvitation.findUnique(
      {
        where: { codeHash },
        include: {
          staff: {
            include: {
              organizationWorkSchedulePlace: true,
            },
          },
        },
      },
    );

    if (!invitation) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_INVITATION_NOT_FOUND,
        'ไม่พบรหัสคำเชิญในระบบ',
        HttpStatus.NOT_FOUND,
      );
    }

    const now = new Date();
    if (invitation.expiresAt.getTime() <= now.getTime()) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_INVITATION_EXPIRED,
        'รหัสคำเชิญหมดอายุแล้ว',
        HttpStatus.GONE,
      );
    }

    if (invitation.status !== 'ISSUED') {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_INVITATION_CONFLICT,
        'รหัสคำเชิญไม่ได้อยู่ในสถานะที่สามารถเปิดดูได้',
        HttpStatus.CONFLICT,
      );
    }

    if (
      invitation.staff.deletedAt !== null ||
      invitation.staff.organizationWorkSchedulePlace.deletedAt !== null ||
      invitation.staff.personId !== null
    ) {
      throw new AppException(
        ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
        'พนักงานหรือสถานที่ทำงานนี้ไม่พร้อมสำหรับการผูกบัญชี',
        HttpStatus.CONFLICT,
      );
    }

    return {
      invitationId: invitation.id,
      staffName: invitation.staff.name,
      placeName: invitation.staff.organizationWorkSchedulePlace.name,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  // 3. Submit
  async submit(
    clerkId: string,
    code: string,
  ): Promise<{
    invitationId: string;
    status: 'PENDING';
    expiresAt: string;
  }> {
    return this.executeWithRetry(async (tx) => {
      const account = await tx.userAccount.findUnique({
        where: { clerkId },
        select: { person: { select: { id: true } } },
      });
      if (!account?.person) {
        throw new AppException(
          ErrorCode.PERSON_NOT_FOUND,
          'ไม่พบข้อมูล Person ของคุณ',
          HttpStatus.NOT_FOUND,
        );
      }
      const requesterPersonId = account.person.id;

      const codeHash = this.hashToken(code);
      const invitation = await tx.workScheduleStaffInvitation.findUnique({
        where: { codeHash },
        include: {
          staff: {
            include: {
              organizationWorkSchedulePlace: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_INVITATION_NOT_FOUND,
          'ไม่พบรหัสคำเชิญในระบบ',
          HttpStatus.NOT_FOUND,
        );
      }

      const now = new Date();
      if (invitation.expiresAt.getTime() <= now.getTime()) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_INVITATION_EXPIRED,
          'รหัสคำเชิญหมดอายุแล้ว',
          HttpStatus.GONE,
        );
      }

      // Check if user is already linked to another staff in this place (even soft deleted)
      const existingPlaceStaff = await tx.workScheduleStaff.findFirst({
        where: {
          organizationWorkSchedulePlaceId:
            invitation.staff.organizationWorkSchedulePlaceId,
          personId: requesterPersonId,
        },
      });
      if (existingPlaceStaff) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
          'บัญชีของคุณถูกผูกกับพนักงานในสถานที่นี้แล้ว',
          HttpStatus.CONFLICT,
        );
      }

      if (
        invitation.staff.deletedAt !== null ||
        invitation.staff.organizationWorkSchedulePlace.deletedAt !== null ||
        invitation.staff.personId !== null
      ) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
          'พนักงานหรือสถานที่ทำงานนี้ไม่พร้อมสำหรับการผูกบัญชี',
          HttpStatus.CONFLICT,
        );
      }

      // Idempotency: if already PENDING by the same person and not expired
      if (
        invitation.status === 'PENDING' &&
        invitation.requestedByPersonId === requesterPersonId
      ) {
        return {
          invitationId: invitation.id,
          status: 'PENDING',
          expiresAt: invitation.expiresAt.toISOString(),
        };
      }

      if (invitation.status !== 'ISSUED') {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_INVITATION_CONFLICT,
          'รหัสคำเชิญนี้ไม่พร้อมใช้งานหรือถูกจองไปแล้ว',
          HttpStatus.CONFLICT,
        );
      }

      const updated = await tx.workScheduleStaffInvitation.updateMany({
        where: {
          id: invitation.id,
          status: 'ISSUED',
        },
        data: {
          status: 'PENDING',
          requestedByPersonId: requesterPersonId,
          requestedAt: now,
        },
      });

      if (updated.count !== 1) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_INVITATION_CONFLICT,
          'สถานะคำเชิญมีการเปลี่ยนแปลง กรุณาลองใหม่อีกครั้ง',
          HttpStatus.CONFLICT,
        );
      }

      return {
        invitationId: invitation.id,
        status: 'PENDING',
        expiresAt: invitation.expiresAt.toISOString(),
      };
    });
  }

  // 4. List Mine
  async listMine(clerkId: string) {
    const account = await this.prisma.userAccount.findUnique({
      where: { clerkId },
      select: { person: { select: { id: true } } },
    });
    if (!account?.person) {
      throw new AppException(
        ErrorCode.PERSON_NOT_FOUND,
        'ไม่พบข้อมูล Person ของคุณ',
        HttpStatus.NOT_FOUND,
      );
    }
    const personId = account.person.id;

    const invitations = await this.prisma.workScheduleStaffInvitation.findMany({
      where: {
        requestedByPersonId: personId,
      },
      include: {
        staff: {
          include: {
            organizationWorkSchedulePlace: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = new Date();
    return {
      invitations: invitations.map((inv) => ({
        id: inv.id,
        staffName: inv.staff.name,
        placeName: inv.staff.organizationWorkSchedulePlace.name,
        status: this.getEffectiveStatus(inv.status, inv.expiresAt, now),
        expiresAt: inv.expiresAt.toISOString(),
        requestedAt: inv.requestedAt ? inv.requestedAt.toISOString() : null,
      })),
    };
  }

  // 5. List By Place
  async listByPlace(clerkId: string, placeId: string) {
    const account = await this.prisma.userAccount.findUnique({
      where: { clerkId },
      select: { person: { select: { id: true } } },
    });
    if (!account?.person) {
      throw new AppException(
        ErrorCode.PERSON_NOT_FOUND,
        'ไม่พบข้อมูล Person ของคุณ',
        HttpStatus.NOT_FOUND,
      );
    }
    const adminPersonId = account.person.id;

    const admin = await this.prisma.workScheduleAdmin.findFirst({
      where: {
        personId: adminPersonId,
        organizationWorkSchedulePlaceId: placeId,
        deletedAt: null,
      },
    });
    if (!admin) {
      throw new AppException(
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        'ผู้ดำเนินการไม่ได้เป็น Admin ของสถานที่นี้',
        HttpStatus.FORBIDDEN,
      );
    }

    const invitations = await this.prisma.workScheduleStaffInvitation.findMany({
      where: {
        staff: {
          organizationWorkSchedulePlaceId: placeId,
        },
      },
      include: {
        staff: true,
        requestedByPerson: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = new Date();
    return {
      invitations: invitations.map((inv) => ({
        id: inv.id,
        staffId: inv.staffId,
        staffName: inv.staff.name,
        status: this.getEffectiveStatus(inv.status, inv.expiresAt, now),
        expiresAt: inv.expiresAt.toISOString(),
        requestedAt: inv.requestedAt ? inv.requestedAt.toISOString() : null,
        requester: inv.requestedByPerson
          ? {
              personId: inv.requestedByPerson.id,
              firstName: inv.requestedByPerson.firstName,
              lastName: inv.requestedByPerson.lastName,
              nickname: inv.requestedByPerson.nickname,
            }
          : null,
      })),
    };
  }

  // 6. Decide
  async decide(
    clerkId: string,
    placeId: string,
    invitationId: string,
    decision: 'APPROVE' | 'REJECT',
  ): Promise<{ invitationId: string; status: 'APPROVED' | 'REJECTED' }> {
    return this.executeWithRetry(async (tx) => {
      const account = await tx.userAccount.findUnique({
        where: { clerkId },
        select: { person: { select: { id: true } } },
      });
      if (!account?.person) {
        throw new AppException(
          ErrorCode.PERSON_NOT_FOUND,
          'ไม่พบข้อมูล Person ของผู้ดำเนินการ',
          HttpStatus.NOT_FOUND,
        );
      }
      const adminPersonId = account.person.id;

      const place = await tx.organizationWorkSchedulePlace.findUnique({
        where: { id: placeId },
        select: { deletedAt: true },
      });
      if (!place || place.deletedAt !== null) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
          'ไม่พบสถานที่ทำงานหรือสถานที่ถูกลบแล้ว',
          HttpStatus.NOT_FOUND,
        );
      }

      const admin = await tx.workScheduleAdmin.findFirst({
        where: {
          personId: adminPersonId,
          organizationWorkSchedulePlaceId: placeId,
          deletedAt: null,
        },
      });
      if (!admin) {
        throw new AppException(
          ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
          'ผู้ดำเนินการไม่ได้เป็น Admin ของสถานที่นี้',
          HttpStatus.FORBIDDEN,
        );
      }

      const invitation = await tx.workScheduleStaffInvitation.findUnique({
        where: { id: invitationId },
        include: {
          staff: true,
        },
      });

      if (
        !invitation ||
        invitation.staff.organizationWorkSchedulePlaceId !== placeId
      ) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_INVITATION_NOT_FOUND,
          'ไม่พบคำเชิญในสถานที่ทำงานนี้',
          HttpStatus.NOT_FOUND,
        );
      }

      const now = new Date();
      if (invitation.expiresAt.getTime() <= now.getTime()) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_INVITATION_EXPIRED,
          'คำเชิญนี้หมดอายุแล้ว ไม่สามารถดำเนินการได้',
          HttpStatus.GONE,
        );
      }

      if (invitation.status !== 'PENDING' || !invitation.requestedByPersonId) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_INVITATION_CONFLICT,
          'คำเชิญไม่ได้อยู่ในสถานะรอการอนุมัติ (PENDING)',
          HttpStatus.CONFLICT,
        );
      }

      if (decision === 'REJECT') {
        const updated = await tx.workScheduleStaffInvitation.updateMany({
          where: {
            id: invitation.id,
            status: 'PENDING',
          },
          data: {
            status: 'REJECTED',
            decidedByPersonId: adminPersonId,
            decidedAt: now,
          },
        });
        if (updated.count !== 1) {
          throw new AppException(
            ErrorCode.WORK_SCHEDULE_INVITATION_CONFLICT,
            'สถานะคำเชิญมีการเปลี่ยนแปลง กรุณาลองใหม่อีกครั้ง',
            HttpStatus.CONFLICT,
          );
        }
        return {
          invitationId: invitation.id,
          status: 'REJECTED',
        };
      }

      // APPROVE path
      // 1. Staff must still be active and unlinked
      const currentStaff = await tx.workScheduleStaff.findUnique({
        where: { id: invitation.staffId },
        select: { id: true, personId: true, deletedAt: true },
      });
      if (!currentStaff || currentStaff.deletedAt !== null) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_NOT_FOUND,
          'ไม่พบพนักงานหรือพนักงานถูกลบแล้ว',
          HttpStatus.NOT_FOUND,
        );
      }
      if (currentStaff.personId !== null) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
          'พนักงานนี้มีผู้ผูกบัญชีไปแล้ว',
          HttpStatus.CONFLICT,
        );
      }

      // 2. Requester must not be linked to any staff in this place (even soft deleted)
      const duplicateLink = await tx.workScheduleStaff.findFirst({
        where: {
          organizationWorkSchedulePlaceId: placeId,
          personId: invitation.requestedByPersonId,
        },
      });
      if (duplicateLink) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
          'ผู้ขอนี้ถูกผูกกับพนักงานอื่นในสถานที่นี้แล้ว',
          HttpStatus.CONFLICT,
        );
      }

      // 3. Conditional update invitation to APPROVED
      const updatedInv = await tx.workScheduleStaffInvitation.updateMany({
        where: {
          id: invitation.id,
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
          decidedByPersonId: adminPersonId,
          decidedAt: now,
        },
      });
      if (updatedInv.count !== 1) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_INVITATION_CONFLICT,
          'สถานะคำเชิญมีการเปลี่ยนแปลง',
          HttpStatus.CONFLICT,
        );
      }

      // 4. Update staff personId conditionally
      const updatedStaff = await tx.workScheduleStaff.updateMany({
        where: {
          id: invitation.staffId,
          personId: null,
          deletedAt: null,
        },
        data: {
          personId: invitation.requestedByPersonId,
        },
      });
      if (updatedStaff.count !== 1) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
          'ไม่สามารถผูกบัญชีพนักงานได้',
          HttpStatus.CONFLICT,
        );
      }

      // 5. Create link audit
      await tx.workScheduleStaffLinkAudit.create({
        data: {
          staffId: invitation.staffId,
          personId: invitation.requestedByPersonId,
          actorPersonId: adminPersonId,
          invitationId: invitation.id,
          action: 'LINK',
          createdAt: now,
        },
      });

      return {
        invitationId: invitation.id,
        status: 'APPROVED',
      };
    });
  }

  // 7. Unlink
  async unlink(
    clerkId: string,
    placeId: string,
    staffId: string,
  ): Promise<void> {
    return this.executeWithRetry(async (tx) => {
      const account = await tx.userAccount.findUnique({
        where: { clerkId },
        select: { person: { select: { id: true } } },
      });
      if (!account?.person) {
        throw new AppException(
          ErrorCode.PERSON_NOT_FOUND,
          'ไม่พบข้อมูล Person ของผู้ดำเนินการ',
          HttpStatus.NOT_FOUND,
        );
      }
      const adminPersonId = account.person.id;

      const place = await tx.organizationWorkSchedulePlace.findUnique({
        where: { id: placeId },
        select: { deletedAt: true },
      });
      if (!place || place.deletedAt !== null) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
          'ไม่พบสถานที่ทำงานหรือสถานที่ถูกลบแล้ว',
          HttpStatus.NOT_FOUND,
        );
      }

      const admin = await tx.workScheduleAdmin.findFirst({
        where: {
          personId: adminPersonId,
          organizationWorkSchedulePlaceId: placeId,
          deletedAt: null,
        },
      });
      if (!admin) {
        throw new AppException(
          ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
          'ผู้ดำเนินการไม่ได้เป็น Admin ของสถานที่นี้',
          HttpStatus.FORBIDDEN,
        );
      }

      const staff = await tx.workScheduleStaff.findUnique({
        where: { id: staffId },
        select: {
          id: true,
          personId: true,
          organizationWorkSchedulePlaceId: true,
          deletedAt: true,
        },
      });

      if (
        !staff ||
        staff.deletedAt !== null ||
        staff.organizationWorkSchedulePlaceId !== placeId
      ) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_NOT_FOUND,
          'ไม่พบพนักงานในสถานที่ทำงานนี้',
          HttpStatus.NOT_FOUND,
        );
      }

      if (staff.personId === null) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
          'พนักงานนี้ไม่ได้ถูกผูกกับบัญชีผู้ใช้ใดๆ',
          HttpStatus.CONFLICT,
        );
      }

      const previouslyLinkedPersonId = staff.personId;
      const now = new Date();

      // Revoke any ISSUED or PENDING invitations for this staff
      await tx.workScheduleStaffInvitation.updateMany({
        where: {
          staffId,
          status: { in: ['ISSUED', 'PENDING'] },
        },
        data: {
          status: 'REVOKED',
          revokedAt: now,
        },
      });

      // Clear personId conditionally
      const updatedStaff = await tx.workScheduleStaff.updateMany({
        where: {
          id: staffId,
          personId: previouslyLinkedPersonId,
        },
        data: {
          personId: null,
        },
      });

      if (updatedStaff.count !== 1) {
        throw new AppException(
          ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
          'เกิดการเปลี่ยนแปลงข้อมูลการผูกบัญชี กรุณาลองใหม่อีกครั้ง',
          HttpStatus.CONFLICT,
        );
      }

      // Record audit UNLINK
      await tx.workScheduleStaffLinkAudit.create({
        data: {
          staffId,
          personId: previouslyLinkedPersonId,
          actorPersonId: adminPersonId,
          invitationId: null,
          action: 'UNLINK',
          createdAt: now,
        },
      });
    });
  }
}
