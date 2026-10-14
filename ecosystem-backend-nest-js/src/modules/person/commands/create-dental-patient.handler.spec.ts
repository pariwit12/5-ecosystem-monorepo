import { CreateDentalPatientHandler } from './create-dental-patient.handler';
import { CreateDentalPatientCommand } from './create-dental-patient.command';
import { Prisma } from '@prisma/client';

describe('CreateDentalPatientHandler', () => {
  it('retries a transaction conflict and returns the committed result', async () => {
    const result = { personId: 'person-1', patientNumber: '5' };
    const transaction = jest
      .fn()
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Conflict', {
          code: 'P2034',
          clientVersion: '7.8.0',
        }),
      )
      .mockResolvedValueOnce(result);
    const handler = new CreateDentalPatientHandler(
      { $transaction: transaction } as never,
      {} as never,
    );
    await expect(
      handler.execute(
        new CreateDentalPatientCommand('staff', {
          organizationDentalClinicId: '00000000-0000-0000-0000-000000000001',
          firstName: 'New',
          lastName: 'Patient',
        }),
      ),
    ).resolves.toEqual(result);
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it('does not retry unrelated database failures', async () => {
    const error = new Error('Database unavailable');
    const transaction = jest.fn().mockRejectedValue(error);
    const handler = new CreateDentalPatientHandler(
      { $transaction: transaction } as never,
      {} as never,
    );
    await expect(
      handler.execute(
        new CreateDentalPatientCommand('staff', {
          organizationDentalClinicId: '00000000-0000-0000-0000-000000000001',
          firstName: 'New',
          lastName: 'Patient',
        }),
      ),
    ).rejects.toBe(error);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
  it('rejects a creator without staff affiliation to the clinic', async () => {
    const tx = {
      userAccount: {
        findUnique: jest.fn().mockResolvedValue({ person: { staff: null } }),
      },
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
      userAccount: {
        findUnique: jest.fn().mockResolvedValue({
          person: {
            staff: {
              clinicAffiliations: [{ personStaffId: 'staff-1', role: 'ADMIN' }],
            },
          },
        }),
      },
      person: {
        create: jest.fn().mockResolvedValue({ id: 'person-2' }),
      },
      personIdentityDocument: {
        findUnique: jest.fn().mockResolvedValue(null),
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
      phone: '0800000000',
      birthDate: new Date('1990-01-01'),
    };
    const tx = {
      userAccount: {
        findUnique: jest.fn().mockResolvedValue({
          person: {
            staff: {
              clinicAffiliations: [{ personStaffId: 'staff-1', role: 'ADMIN' }],
            },
          },
        }),
      },
      person: {
        create: jest.fn(),
      },
      personIdentityDocument: {
        findUnique: jest.fn().mockResolvedValue({ person }),
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

  it('rejects patient creation by receptionists', async () => {
    const tx = {
      userAccount: {
        findUnique: jest.fn().mockResolvedValue({
          person: {
            staff: { clinicAffiliations: [{ role: 'RECEPTIONIST' }] },
            dentist: { clinicAffiliations: [] },
          },
        }),
      },
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
        new CreateDentalPatientCommand('receptionist', {
          organizationDentalClinicId: '00000000-0000-0000-0000-000000000001',
          firstName: 'New',
          lastName: 'Patient',
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
});
