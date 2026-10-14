import { NotFoundException } from '@nestjs/common';
import { GetDentalPatientByIdHandler } from './get-dental-patient-by-id.handler';
import { GetDentalPatientByIdQuery } from './get-dental-patient-by-id.query';

describe('GetDentalPatientByIdHandler', () => {
  const staffAccess = { verify: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('returns sensitive patient details after clinic access is verified', async () => {
    staffAccess.verify.mockResolvedValue({ role: 'RECEPTIONIST' });
    const findUnique = jest.fn().mockResolvedValue({
      patientNumber: '5',
      personDentalPatient: {
        person: {
          id: 'person-1',
          version: 3,
          firstName: 'สมหญิง',
          lastName: 'ใจดี',
          nickname: 'หญิง',
          phone: '0899999999',
          birthDate: null,
          identityDocuments: [
            {
              type: 'THAI_CID',
              issuingCountry: 'TH',
              normalizedValue: '1234567890123',
              expiresAt: null,
            },
          ],
        },
      },
    });
    const handler = new GetDentalPatientByIdHandler(
      { personDentalPatientAffiliation: { findUnique } } as never,
      staffAccess as never,
    );

    await expect(
      handler.execute(
        new GetDentalPatientByIdQuery('clerk-1', 'person-1', 'clinic-1'),
      ),
    ).resolves.toMatchObject({
      personId: 'person-1',
      version: 3,
      patientNumber: '5',
      cid: '1234567890123',
      identityDocuments: [
        {
          type: 'THAI_CID',
          issuingCountry: 'TH',
          value: '1234567890123',
          expiresAt: null,
        },
      ],
    });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          personDentalPatientId_organizationDentalClinicId: {
            personDentalPatientId: 'person-1',
            organizationDentalClinicId: 'clinic-1',
          },
        },
      }),
    );
  });

  it('does not expose a patient who is not affiliated with the clinic', async () => {
    staffAccess.verify.mockResolvedValue({ role: 'ADMIN' });
    const handler = new GetDentalPatientByIdHandler(
      {
        personDentalPatientAffiliation: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      } as never,
      staffAccess as never,
    );

    await expect(
      handler.execute(
        new GetDentalPatientByIdQuery(
          'clerk-1',
          'person-other-clinic',
          'clinic-1',
        ),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });


  it('returns only permitted profile fields to dentists', async () => {
    staffAccess.verify.mockResolvedValue({ role: 'DENTIST' });
    const findUnique = jest.fn().mockResolvedValue({
      patientNumber: '5',
      personDentalPatient: {
        person: {
          id: 'person-1',
          version: 3,
          firstName: 'Alice',
          lastName: 'Example',
          nickname: 'Ali',
          phone: '0899999999',
          birthDate: null,
          identityDocuments: [
            {
              type: 'THAI_CID',
              issuingCountry: 'TH',
              normalizedValue: '1234567890123',
              expiresAt: null,
            },
          ],
        },
      },
    });
    const handler = new GetDentalPatientByIdHandler(
      { personDentalPatientAffiliation: { findUnique } } as never,
      staffAccess as never,
    );

    await expect(
      handler.execute(
        new GetDentalPatientByIdQuery('dentist', 'person-1', 'clinic-1'),
      ),
    ).resolves.toEqual({
      personId: 'person-1',
      version: 3,
      patientNumber: '5',
      firstName: 'Alice',
      lastName: 'Example',
    });
  });
});
