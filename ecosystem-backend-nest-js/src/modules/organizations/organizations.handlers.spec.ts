import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/exceptions/error-codes.enum';
import { CreateOrganizationHandler } from './commands/create-organization.handler';
import { CreateOrganizationCommand } from './commands/create-organization.command';
import { GetOrganizationByIdHandler } from './queries/get-organization-by-id.handler';
import { GetOrganizationByIdQuery } from './queries/get-organization-by-id.query';
import { GetOrganizationsHandler } from './queries/get-organizations.handler';
import { GetOrganizationsQuery } from './queries/get-organizations.query';
import { UpdateOrganizationByIdHandler } from './commands/update-organization-by-id.handler';
import { UpdateOrganizationByIdCommand } from './commands/update-organization-by-id.command';

describe('organization handlers', () => {
  const prisma = {
    organization: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const accessControlService = {
    verifyPerson: jest.fn(),
    verifyOrganizationAccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an organization for the verified person', async () => {
    accessControlService.verifyPerson.mockResolvedValue({ personId: 'person-1' });
    prisma.organization.create.mockResolvedValue({ id: 'org-1', name: 'Clinic' });

    const handler = new CreateOrganizationHandler(
      prisma as never,
      accessControlService as never,
    );

    await expect(
      handler.execute(
        new CreateOrganizationCommand('clerk-1', { name: 'Clinic' } as never),
      ),
    ).resolves.toEqual({ id: 'org-1' });

    expect(prisma.organization.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: 'Clinic',
          personOrganizationAffiliations: { create: { personId: 'person-1' } },
        },
      }),
    );
  });

  it('lists organizations available to the verified person', async () => {
    accessControlService.verifyPerson.mockResolvedValue({ personId: 'person-1' });
    prisma.organization.findMany.mockResolvedValue([
      { id: 'org-1', name: 'Clinic A' },
      { id: 'org-2', name: 'Clinic B' },
    ]);

    const handler = new GetOrganizationsHandler(
      prisma as never,
      accessControlService as never,
    );

    await expect(handler.execute(new GetOrganizationsQuery('clerk-1'))).resolves.toEqual({
      organizations: [
        { id: 'org-1', name: 'Clinic A' },
        { id: 'org-2', name: 'Clinic B' },
      ],
    });

    expect(accessControlService.verifyPerson).toHaveBeenCalledWith('clerk-1');
  });

  it('updates an organization after access is verified', async () => {
    accessControlService.verifyOrganizationAccess.mockResolvedValue(undefined);
    prisma.organization.update.mockResolvedValue({ id: 'org-1' });

    const handler = new UpdateOrganizationByIdHandler(
      prisma as never,
      accessControlService as never,
    );

    await expect(
      handler.execute(
        new UpdateOrganizationByIdCommand(
          'clerk-1',
          { organization_id: 'org-1' } as never,
          { name: 'Updated Clinic' } as never,
        ),
      ),
    ).resolves.toEqual({ id: 'org-1' });

    expect(prisma.organization.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'org-1' },
        data: { name: 'Updated Clinic' },
      }),
    );
  });

  it('returns an organization by id after access is verified', async () => {
    accessControlService.verifyOrganizationAccess.mockResolvedValue(undefined);
    prisma.organization.findFirst.mockResolvedValue({ id: 'org-1', name: 'Clinic' });

    const handler = new GetOrganizationByIdHandler(
      prisma as never,
      accessControlService as never,
    );

    await expect(
      handler.execute(
        new GetOrganizationByIdQuery('clerk-1', { organization_id: 'org-1' } as never),
      ),
    ).resolves.toEqual({ id: 'org-1', name: 'Clinic' });
  });

  it('throws a not-found exception when an organization is missing', async () => {
    accessControlService.verifyOrganizationAccess.mockResolvedValue(undefined);
    prisma.organization.findFirst.mockResolvedValue(null);

    const handler = new GetOrganizationByIdHandler(
      prisma as never,
      accessControlService as never,
    );

    await expect(
      handler.execute(
        new GetOrganizationByIdQuery('clerk-1', { organization_id: 'org-1' } as never),
      ),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.ORGANIZATION_NOT_FOUND,
    } satisfies Partial<AppException>);
  });
});
