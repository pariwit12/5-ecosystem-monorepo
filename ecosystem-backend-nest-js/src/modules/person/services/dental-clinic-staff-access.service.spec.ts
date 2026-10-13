import { ForbiddenException } from '@nestjs/common';
import { DentalClinicStaffAccessService } from './dental-clinic-staff-access.service';

describe('DentalClinicStaffAccessService', () => {
  const findUnique = jest.fn();
  const service = new DentalClinicStaffAccessService({
    userAccount: { findUnique },
  } as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns the clinic role for an active staff affiliation', async () => {
    findUnique.mockResolvedValue({
      person: {
        staff: { clinicAffiliations: [{ role: 'RECEPTIONIST' }] },
      },
    });

    await expect(service.verify('clerk-1', 'clinic-1')).resolves.toEqual({
      role: 'RECEPTIONIST',
    });
  });

  it('rejects an account without a staff affiliation at the clinic', async () => {
    findUnique.mockResolvedValue({
      person: { staff: { clinicAffiliations: [] } },
    });

    await expect(service.verify('clerk-1', 'clinic-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
