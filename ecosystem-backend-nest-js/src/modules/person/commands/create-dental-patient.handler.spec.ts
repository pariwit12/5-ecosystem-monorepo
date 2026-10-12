import { CreateDentalPatientHandler } from './create-dental-patient.handler';
import { CreateDentalPatientCommand } from './create-dental-patient.command';

describe('CreateDentalPatientHandler', () => {
  it('rejects a creator without staff affiliation to the clinic', async () => {
    const tx = {
      person: { findUnique: jest.fn().mockResolvedValue({ staff: null }) },
    };
    const handler = new CreateDentalPatientHandler(
      {
        $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
          callback(tx),
        ),
      } as never,
      {} as never,
    );

    await expect(
      handler.execute(
        new CreateDentalPatientCommand('clerk-outsider', {
          organizationDentalClinicId: '00000000-0000-0000-0000-000000000001',
          firstName: 'New',
          lastName: 'Patient',
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('creates the person, patient, and first clinic affiliation together', async () => {
    const tx = {
      person: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            staff: { clinicAffiliations: [{ personStaffId: 'staff-1' }] },
          })
          .mockResolvedValueOnce(null),
        create: jest.fn().mockResolvedValue({ id: 'person-2' }),
      },
      personDentalPatient: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ personId: 'person-2' }),
      },
      personDentalPatientAffiliation: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };
    const patientNumberService = {
      allocateNextInTransaction: jest.fn().mockResolvedValue('1'),
    };
    const handler = new CreateDentalPatientHandler(
      {
        $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
          callback(tx),
        ),
      } as never,
      patientNumberService as never,
    );

    await expect(
      handler.execute(
        new CreateDentalPatientCommand('clerk-staff', {
          organizationDentalClinicId: '00000000-0000-0000-0000-000000000001',
          firstName: 'New',
          lastName: 'Patient',
          cid: '9876543210123',
        }),
      ),
    ).resolves.toMatchObject({
      personId: 'person-2',
      patientNumber: '1',
      createdPerson: true,
      createdPatient: true,
      createdAffiliation: true,
    });
  });

  it('does not overwrite an existing person matched by cid', async () => {
    const person = {
      id: 'person-1',
      firstName: 'Existing',
      lastName: 'Patient',
      cid: '1234567890123',
      phone: '0800000000',
      birthDate: new Date('1990-01-01'),
    };
    const tx = {
      person: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            staff: { clinicAffiliations: [{ personStaffId: 'staff-1' }] },
          })
          .mockResolvedValueOnce(person),
        create: jest.fn(),
      },
      personDentalPatient: {
        findUnique: jest.fn().mockResolvedValue({ personId: 'person-1' }),
      },
      personDentalPatientAffiliation: {
        findUnique: jest.fn().mockResolvedValue({ patientNumber: '5' }),
        create: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const patientNumberService = {
      allocateNextInTransaction: jest.fn(),
    };
    const handler = new CreateDentalPatientHandler(
      prisma as never,
      patientNumberService as never,
    );

    const result = await handler.execute(
      new CreateDentalPatientCommand('clerk-staff', {
        organizationDentalClinicId: '00000000-0000-0000-0000-000000000001',
        firstName: 'Changed',
        lastName: 'Name',
        cid: '1234567890123',
        phone: '0899999999',
      }),
    );

    expect(result).toMatchObject({
      personId: 'person-1',
      patientNumber: '5',
      createdAffiliation: false,
    });
    expect(tx.person.create).not.toHaveBeenCalled();
    expect(
      patientNumberService.allocateNextInTransaction,
    ).not.toHaveBeenCalled();
  });
});
