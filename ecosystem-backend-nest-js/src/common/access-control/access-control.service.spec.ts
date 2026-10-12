import { AccessControlService } from './access-control.service';
import { ErrorCode } from '../exceptions/error-codes.enum';

describe('AccessControlService', () => {
  const prisma = {
    userAccount: { findUnique: jest.fn() },
    organization: { findUnique: jest.fn() },
    personOrganizationAffiliation: { findUnique: jest.fn() },
    organizationWorkSchedulePlace: { findUnique: jest.fn() },
    workScheduleAdmin: { findFirst: jest.fn() },
    workSchedulePosition: { findUnique: jest.fn() },
    workScheduleSlotTemplate: { findUnique: jest.fn() },
  };

  const service = new AccessControlService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns the person id for a known Clerk user', async () => {
    prisma.userAccount.findUnique.mockResolvedValue({
      person: { id: 'person-1' },
    });

    await expect(service.verifyPerson('clerk-1')).resolves.toEqual({
      personId: 'person-1',
    });
  });

  it('rejects an unknown Clerk user', async () => {
    prisma.userAccount.findUnique.mockResolvedValue(null);

    await expect(service.verifyPerson('unknown')).rejects.toMatchObject({
      errorCode: ErrorCode.PERSON_NOT_FOUND,
    });
  });

  it('rejects access to a deleted organization', async () => {
    prisma.organization.findUnique.mockResolvedValue({ deletedAt: new Date() });

    await expect(
      service.verifyOrganizationAccess('clerk-1', 'org-1'),
    ).rejects.toMatchObject({ errorCode: ErrorCode.ORGANIZATION_DELETED });

    expect(prisma.userAccount.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a person who is not an organization member', async () => {
    prisma.organization.findUnique.mockResolvedValue({ deletedAt: null });
    prisma.userAccount.findUnique.mockResolvedValue({
      person: { id: 'person-1' },
    });
    prisma.personOrganizationAffiliation.findUnique.mockResolvedValue(null);

    await expect(
      service.verifyOrganizationAccess('clerk-1', 'org-1'),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
    });
  });

  it('returns the person id for an organization member', async () => {
    prisma.organization.findUnique.mockResolvedValue({ deletedAt: null });
    prisma.userAccount.findUnique.mockResolvedValue({
      person: { id: 'person-1' },
    });
    prisma.personOrganizationAffiliation.findUnique.mockResolvedValue({
      personId: 'person-1',
      organizationId: 'org-1',
    });

    await expect(
      service.verifyOrganizationAccess('clerk-1', 'org-1'),
    ).resolves.toEqual({ personId: 'person-1' });
  });

  it('rejects access to a deleted work-schedule place', async () => {
    prisma.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
      deletedAt: new Date(),
    });

    await expect(
      service.verifyWorkScheduleAdminAccess('clerk-1', 'place-1'),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
    });
  });

  it('returns the person id for a work-schedule admin', async () => {
    prisma.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
      deletedAt: null,
    });
    prisma.userAccount.findUnique.mockResolvedValue({
      person: { id: 'person-1' },
    });
    prisma.workScheduleAdmin.findFirst.mockResolvedValue({ id: 'admin-1' });

    await expect(
      service.verifyWorkScheduleAdminAccess('clerk-1', 'place-1'),
    ).resolves.toEqual({ personId: 'person-1' });
  });

  it('returns scope information for a position admin', async () => {
    prisma.workSchedulePosition.findUnique.mockResolvedValue({
      deletedAt: null,
      organizationWorkSchedulePlace: { id: 'place-1', deletedAt: null },
    });
    prisma.userAccount.findUnique.mockResolvedValue({
      person: { id: 'person-1' },
    });
    prisma.workScheduleAdmin.findFirst.mockResolvedValue({ id: 'admin-1' });

    await expect(
      service.verifyWorkSchedulePositionByWorkScheduleAdmin(
        'clerk-1',
        'position-1',
      ),
    ).resolves.toEqual({
      personId: 'person-1',
      organizationWorkSchedulePlaceId: 'place-1',
    });
  });

  it('rejects a slot-template when its position is deleted', async () => {
    prisma.workScheduleSlotTemplate.findUnique.mockResolvedValue({
      workSchedulePosition: {
        id: 'position-1',
        deletedAt: new Date(),
        organizationWorkSchedulePlace: { id: 'place-1', deletedAt: null },
      },
    });

    await expect(
      service.verifyWorkScheduleSlotTemplateIdByWorkScheduleAdmin(
        'clerk-1',
        'template-1',
      ),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
    });
  });
});
