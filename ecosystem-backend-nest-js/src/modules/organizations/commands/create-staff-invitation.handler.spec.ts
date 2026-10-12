import { CreateStaffInvitationCommand } from './create-staff-invitation.command';
import { CreateStaffInvitationHandler } from './create-staff-invitation.handler';

describe('CreateStaffInvitationHandler', () => {
  it('returns the one-time code but stores only its hash', async () => {
    let storedData:
      | { codeHash: string; createdByPersonId: string; code?: string }
      | undefined;
    const prisma = {
      organizationDentalClinic: {
        findFirst: jest.fn().mockResolvedValue({ id: 'clinic-1' }),
      },
      staffInvitation: {
        create: jest.fn(
          (args: {
            data: {
              codeHash: string;
              createdByPersonId: string;
              code?: string;
            };
          }) => {
            storedData = args.data;
            return Promise.resolve({});
          },
        ),
      },
    };
    const accessControl = {
      verifyOrganizationAdmin: jest
        .fn()
        .mockResolvedValue({ personId: 'admin-1' }),
    };
    const handler = new CreateStaffInvitationHandler(
      prisma as never,
      accessControl as never,
    );

    const result = await handler.execute(
      new CreateStaffInvitationCommand('clerk-1', 'org-1', 'clinic-1', {
        role: 'RECEPTIONIST',
      }),
    );

    expect(storedData).toBeDefined();
    if (!storedData) throw new Error('Invitation was not stored');
    expect(result.code).toBeTruthy();
    expect(storedData.codeHash).not.toBe(result.code);
    expect(storedData.codeHash).toHaveLength(64);
    expect(storedData).not.toHaveProperty('code');
    expect(storedData.createdByPersonId).toBe('admin-1');
  });
});
