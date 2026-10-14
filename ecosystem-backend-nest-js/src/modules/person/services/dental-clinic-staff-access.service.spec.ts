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
        dentist: { clinicAffiliations: [] },
      },
    });

    await expect(service.verify('clerk-1', 'clinic-1')).resolves.toEqual({
      role: 'RECEPTIONIST',
    });
  });

  it('recognizes a dentist through the separate dentist affiliation', async () => {
    findUnique.mockResolvedValue({
      person: {
        staff: { clinicAffiliations: [] },
        dentist: { clinicAffiliations: [{ personDentistId: 'person-1' }] },
      },
    });

    await expect(service.verify('clerk-1', 'clinic-1')).resolves.toEqual({
      role: 'DENTIST',
    });
  });

  it('rejects an account without an active staff or dentist affiliation', async () => {
    findUnique.mockResolvedValue({
      person: {
        staff: { clinicAffiliations: [] },
        dentist: { clinicAffiliations: [] },
      },
    });

    await expect(service.verify('clerk-1', 'clinic-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
