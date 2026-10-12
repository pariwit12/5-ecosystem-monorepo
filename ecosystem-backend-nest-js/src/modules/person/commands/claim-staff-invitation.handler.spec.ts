import { createHash } from 'node:crypto';
import { ClaimStaffInvitationCommand } from './claim-staff-invitation.command';
import { ClaimStaffInvitationHandler } from './claim-staff-invitation.handler';

describe('ClaimStaffInvitationHandler', () => {
  it('claims an unbound invitation for the signed-in person', async () => {
    const code = 'one-time-code';
    const invitation = {
      id: 'invite-1',
      codeHash: createHash('sha256').update(code).digest('hex'),
      organizationDentalClinicId: 'clinic-1',
      role: 'RECEPTIONIST',
      targetPersonId: null,
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const tx = {
      staffInvitation: {
        findUnique: jest.fn().mockResolvedValue(invitation),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      person: {
        findUnique: jest.fn().mockResolvedValue({ id: 'person-1' }),
      },
      personStaff: { upsert: jest.fn() },
      personStaffAffiliation: { upsert: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
      ),
    };
    const handler = new ClaimStaffInvitationHandler(prisma as never);

    await expect(
      handler.execute(new ClaimStaffInvitationCommand('clerk-1', code)),
    ).resolves.toEqual({
      organizationDentalClinicId: 'clinic-1',
      role: 'RECEPTIONIST',
    });
    expect(tx.personStaffAffiliation.upsert).toHaveBeenCalledTimes(1);
    expect(tx.staffInvitation.updateMany).toHaveBeenCalledTimes(1);
  });

  it('rejects an invitation that was already used', async () => {
    const tx = {
      staffInvitation: {
        findUnique: jest.fn().mockResolvedValue({
          usedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        }),
      },
    };
    const handler = new ClaimStaffInvitationHandler({
      $transaction: jest.fn(
        (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
      ),
    } as never);

    await expect(
      handler.execute(new ClaimStaffInvitationCommand('clerk-1', 'used-code')),
    ).rejects.toMatchObject({ status: 409 });
  });
});
