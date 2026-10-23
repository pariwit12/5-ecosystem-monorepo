/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { WorkScheduleStaffInvitationService } from './work-schedule-staff-invitation.service';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';

describe('WorkScheduleStaffInvitationService', () => {
  let service: WorkScheduleStaffInvitationService;

  const mockTx = {
    userAccount: { findUnique: jest.fn() },
    organizationWorkSchedulePlace: { findUnique: jest.fn() },
    workScheduleAdmin: { findFirst: jest.fn() },
    workScheduleStaff: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    workScheduleStaffInvitation: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    workScheduleStaffLinkAudit: {
      create: jest.fn(),
    },
  };

  const mockPrisma = {
    $transaction: jest.fn(
      async <T>(callback: (tx: typeof mockTx) => Promise<T>): Promise<T> =>
        await callback(mockTx),
    ),
    userAccount: { findUnique: jest.fn() },
    workScheduleStaffInvitation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    workScheduleAdmin: { findFirst: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkScheduleStaffInvitationService(mockPrisma as never);
  });

  describe('issue', () => {
    it('issues an invitation successfully and stores hash, revoking previous active', async () => {
      mockTx.userAccount.findUnique.mockResolvedValue({
        person: { id: 'admin-person-1' },
      });
      mockTx.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
        deletedAt: null,
      });
      mockTx.workScheduleAdmin.findFirst.mockResolvedValue({
        id: 'admin-entry',
      });
      mockTx.workScheduleStaff.findUnique.mockResolvedValue({
        id: 'staff-1',
        organizationWorkSchedulePlaceId: 'place-1',
        personId: null,
        deletedAt: null,
      });
      mockTx.workScheduleStaffInvitation.findUnique.mockResolvedValue(null);
      mockTx.workScheduleStaffInvitation.create.mockResolvedValue({
        id: 'invitation-1',
      });

      const res = await service.issue('clerk-admin', 'place-1', 'staff-1');

      expect(res.invitationId).toBe('invitation-1');
      expect(res.code).toMatch(/^[A-Za-z0-9_-]{24}$/);
      expect(
        mockTx.workScheduleStaffInvitation.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          staffId: 'staff-1',
          status: { in: ['ISSUED', 'PENDING'] },
        },
        data: expect.objectContaining({ status: 'REVOKED' }),
      });
      expect(mockTx.workScheduleStaffInvitation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          staffId: 'staff-1',
          codeHash: service.hashToken(res.code),
          status: 'ISSUED',
          createdByPersonId: 'admin-person-1',
        }),
      });
    });

    it('rejects if staff is already linked', async () => {
      mockTx.userAccount.findUnique.mockResolvedValue({
        person: { id: 'admin-person-1' },
      });
      mockTx.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
        deletedAt: null,
      });
      mockTx.workScheduleAdmin.findFirst.mockResolvedValue({
        id: 'admin-entry',
      });
      mockTx.workScheduleStaff.findUnique.mockResolvedValue({
        id: 'staff-1',
        organizationWorkSchedulePlaceId: 'place-1',
        personId: 'existing-person',
        deletedAt: null,
      });

      await expect(
        service.issue('clerk-admin', 'place-1', 'staff-1'),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
      });
    });
  });

  describe('preview', () => {
    it('returns preview details without mutating', async () => {
      mockPrisma.userAccount.findUnique.mockResolvedValue({
        person: { id: 'requester-person-1' },
      });
      const validCode = 'abcdefghijklmnopqrstuvwx';
      mockPrisma.workScheduleStaffInvitation.findUnique.mockResolvedValue({
        id: 'invitation-1',
        status: 'ISSUED',
        expiresAt: new Date(Date.now() + 1000000),
        staff: {
          name: 'Alice',
          personId: null,
          deletedAt: null,
          organizationWorkSchedulePlace: {
            name: 'Clinic A',
            deletedAt: null,
          },
        },
      });

      const res = await service.preview('clerk-requester', validCode);

      expect(res).toEqual({
        invitationId: 'invitation-1',
        staffName: 'Alice',
        placeName: 'Clinic A',
        expiresAt: expect.any(String),
      });
    });

    it('rejects if invitation is expired', async () => {
      mockPrisma.userAccount.findUnique.mockResolvedValue({
        person: { id: 'requester-person-1' },
      });
      mockPrisma.workScheduleStaffInvitation.findUnique.mockResolvedValue({
        id: 'invitation-1',
        status: 'ISSUED',
        expiresAt: new Date(Date.now() - 1000),
        staff: {
          name: 'Alice',
          deletedAt: null,
          organizationWorkSchedulePlace: { deletedAt: null },
        },
      });

      await expect(
        service.preview('clerk-requester', 'abcdefghijklmnopqrstuvwx'),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.WORK_SCHEDULE_INVITATION_EXPIRED,
      });
    });
  });

  describe('submit', () => {
    it('reserves code to requester, sets PENDING', async () => {
      mockTx.userAccount.findUnique.mockResolvedValue({
        person: { id: 'requester-person-1' },
      });
      const validCode = 'abcdefghijklmnopqrstuvwx';
      mockTx.workScheduleStaffInvitation.findUnique.mockResolvedValue({
        id: 'invitation-1',
        status: 'ISSUED',
        expiresAt: new Date(Date.now() + 1000000),
        staff: {
          organizationWorkSchedulePlaceId: 'place-1',
          personId: null,
          deletedAt: null,
          organizationWorkSchedulePlace: { deletedAt: null },
        },
      });
      mockTx.workScheduleStaff.findFirst.mockResolvedValue(null);
      mockTx.workScheduleStaffInvitation.updateMany.mockResolvedValue({
        count: 1,
      });

      const res = await service.submit('clerk-requester', validCode);

      expect(res.status).toBe('PENDING');
      expect(
        mockTx.workScheduleStaffInvitation.updateMany,
      ).toHaveBeenCalledWith({
        where: { id: 'invitation-1', status: 'ISSUED' },
        data: expect.objectContaining({
          status: 'PENDING',
          requestedByPersonId: 'requester-person-1',
        }),
      });
    });

    it('returns existing pending if submitted by the same requester idempotently', async () => {
      mockTx.userAccount.findUnique.mockResolvedValue({
        person: { id: 'requester-person-1' },
      });
      mockTx.workScheduleStaffInvitation.findUnique.mockResolvedValue({
        id: 'invitation-1',
        status: 'PENDING',
        requestedByPersonId: 'requester-person-1',
        expiresAt: new Date(Date.now() + 1000000),
        staff: {
          organizationWorkSchedulePlaceId: 'place-1',
          personId: null,
          deletedAt: null,
          organizationWorkSchedulePlace: { deletedAt: null },
        },
      });
      mockTx.workScheduleStaff.findFirst.mockResolvedValue(null);

      const res = await service.submit(
        'clerk-requester',
        'abcdefghijklmnopqrstuvwx',
      );
      expect(res.status).toBe('PENDING');
      expect(
        mockTx.workScheduleStaffInvitation.updateMany,
      ).not.toHaveBeenCalled();
    });

    it('rejects if another user already has pending on this code', async () => {
      mockTx.userAccount.findUnique.mockResolvedValue({
        person: { id: 'other-person' },
      });
      mockTx.workScheduleStaffInvitation.findUnique.mockResolvedValue({
        id: 'invitation-1',
        status: 'PENDING',
        requestedByPersonId: 'first-person',
        expiresAt: new Date(Date.now() + 1000000),
        staff: {
          organizationWorkSchedulePlaceId: 'place-1',
          personId: null,
          deletedAt: null,
          organizationWorkSchedulePlace: { deletedAt: null },
        },
      });
      mockTx.workScheduleStaff.findFirst.mockResolvedValue(null);

      await expect(
        service.submit('clerk-other', 'abcdefghijklmnopqrstuvwx'),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.WORK_SCHEDULE_INVITATION_CONFLICT,
      });
    });
  });

  describe('decide', () => {
    it('approves invitation, sets personId on staff, and writes LINK audit', async () => {
      mockTx.userAccount.findUnique.mockResolvedValue({
        person: { id: 'admin-person-1' },
      });
      mockTx.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
        deletedAt: null,
      });
      mockTx.workScheduleAdmin.findFirst.mockResolvedValue({
        id: 'admin-entry',
      });
      mockTx.workScheduleStaffInvitation.findUnique.mockResolvedValue({
        id: 'invitation-1',
        staffId: 'staff-1',
        status: 'PENDING',
        requestedByPersonId: 'requester-person-1',
        expiresAt: new Date(Date.now() + 1000000),
        staff: {
          organizationWorkSchedulePlaceId: 'place-1',
        },
      });
      mockTx.workScheduleStaff.findUnique.mockResolvedValue({
        id: 'staff-1',
        personId: null,
        deletedAt: null,
      });
      mockTx.workScheduleStaff.findFirst.mockResolvedValue(null);
      mockTx.workScheduleStaffInvitation.updateMany.mockResolvedValue({
        count: 1,
      });
      mockTx.workScheduleStaff.updateMany.mockResolvedValue({ count: 1 });
      mockTx.workScheduleStaffLinkAudit.create.mockResolvedValue({
        id: 'audit-1',
      });

      const res = await service.decide(
        'clerk-admin',
        'place-1',
        'invitation-1',
        'APPROVE',
      );

      expect(res.status).toBe('APPROVED');
      expect(mockTx.workScheduleStaff.updateMany).toHaveBeenCalledWith({
        where: { id: 'staff-1', personId: null, deletedAt: null },
        data: { personId: 'requester-person-1' },
      });
      expect(mockTx.workScheduleStaffLinkAudit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          staffId: 'staff-1',
          personId: 'requester-person-1',
          actorPersonId: 'admin-person-1',
          action: 'LINK',
        }),
      });
    });

    it('rejects invitation without modifying staff', async () => {
      mockTx.userAccount.findUnique.mockResolvedValue({
        person: { id: 'admin-person-1' },
      });
      mockTx.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
        deletedAt: null,
      });
      mockTx.workScheduleAdmin.findFirst.mockResolvedValue({
        id: 'admin-entry',
      });
      mockTx.workScheduleStaffInvitation.findUnique.mockResolvedValue({
        id: 'invitation-1',
        staffId: 'staff-1',
        status: 'PENDING',
        requestedByPersonId: 'requester-person-1',
        expiresAt: new Date(Date.now() + 1000000),
        staff: {
          organizationWorkSchedulePlaceId: 'place-1',
        },
      });
      mockTx.workScheduleStaffInvitation.updateMany.mockResolvedValue({
        count: 1,
      });

      const res = await service.decide(
        'clerk-admin',
        'place-1',
        'invitation-1',
        'REJECT',
      );

      expect(res.status).toBe('REJECTED');
      expect(mockTx.workScheduleStaff.updateMany).not.toHaveBeenCalled();
      expect(mockTx.workScheduleStaffLinkAudit.create).not.toHaveBeenCalled();
    });
  });

  describe('unlink', () => {
    it('unlinks staff, revokes pending invitations, and writes UNLINK audit', async () => {
      mockTx.userAccount.findUnique.mockResolvedValue({
        person: { id: 'admin-person-1' },
      });
      mockTx.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
        deletedAt: null,
      });
      mockTx.workScheduleAdmin.findFirst.mockResolvedValue({
        id: 'admin-entry',
      });
      mockTx.workScheduleStaff.findUnique.mockResolvedValue({
        id: 'staff-1',
        personId: 'linked-person-1',
        organizationWorkSchedulePlaceId: 'place-1',
        deletedAt: null,
      });
      mockTx.workScheduleStaff.updateMany.mockResolvedValue({ count: 1 });
      mockTx.workScheduleStaffInvitation.updateMany.mockResolvedValue({
        count: 1,
      });
      mockTx.workScheduleStaffLinkAudit.create.mockResolvedValue({
        id: 'audit-2',
      });

      await service.unlink('clerk-admin', 'place-1', 'staff-1');

      expect(
        mockTx.workScheduleStaffInvitation.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          staffId: 'staff-1',
          status: { in: ['ISSUED', 'PENDING'] },
        },
        data: expect.objectContaining({ status: 'REVOKED' }),
      });
      expect(mockTx.workScheduleStaff.updateMany).toHaveBeenCalledWith({
        where: { id: 'staff-1', personId: 'linked-person-1' },
        data: { personId: null },
      });
      expect(mockTx.workScheduleStaffLinkAudit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          staffId: 'staff-1',
          personId: 'linked-person-1',
          actorPersonId: 'admin-person-1',
          action: 'UNLINK',
        }),
      });
    });

    it('rejects unlink if staff was not linked', async () => {
      mockTx.userAccount.findUnique.mockResolvedValue({
        person: { id: 'admin-person-1' },
      });
      mockTx.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
        deletedAt: null,
      });
      mockTx.workScheduleAdmin.findFirst.mockResolvedValue({
        id: 'admin-entry',
      });
      mockTx.workScheduleStaff.findUnique.mockResolvedValue({
        id: 'staff-1',
        personId: null,
        organizationWorkSchedulePlaceId: 'place-1',
        deletedAt: null,
      });

      await expect(
        service.unlink('clerk-admin', 'place-1', 'staff-1'),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.WORK_SCHEDULE_STAFF_LINK_CONFLICT,
      });
    });
  });
});
