import { GetDentalPatientsHandler } from './get-dental-patients.handler';
import { GetDentalPatientsQuery } from './get-dental-patients.query';

describe('GetDentalPatientsHandler', () => {
  it('returns a clinic-scoped, paginated patient list', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        patientNumber: '12',
        personDentalPatient: {
          person: {
            id: 'person-1',
            firstName: 'สมชาย',
            lastName: 'ใจดี',
            nickname: null,
            phone: '0812345678',
            birthDate: null,
          },
        },
      },
    ]);
    const count = jest.fn().mockResolvedValue(21);
    const prisma = {
      personDentalPatientAffiliation: { findMany, count },
      $transaction: jest
        .fn()
        .mockImplementation((operations: Promise<unknown>[]) =>
          Promise.all(operations),
        ),
    };
    const staffAccess = {
      verify: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
    };
    const handler = new GetDentalPatientsHandler(
      prisma as never,
      staffAccess as never,
    );

    const result = await handler.execute(
      new GetDentalPatientsQuery('clerk-1', {
        organizationDentalClinicId: 'clinic-1',
        search: 'สมชาย',
        page: 2,
        pageSize: 10,
      }),
    );

    expect(staffAccess.verify).toHaveBeenCalledWith('clerk-1', 'clinic-1');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
    expect(result).toEqual({
      patients: [
        {
          personId: 'person-1',
          patientNumber: '12',
          firstName: 'สมชาย',
          lastName: 'ใจดี',
          nickname: null,
          phone: '0812345678',
          birthDate: null,
        },
      ],
      pagination: { page: 2, pageSize: 10, total: 21, totalPages: 3 },
    });
  });

  it('does not query patient data when access is denied', async () => {
    const prisma = {
      personDentalPatientAffiliation: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const error = new Error('forbidden');
    const staffAccess = { verify: jest.fn().mockRejectedValue(error) };
    const handler = new GetDentalPatientsHandler(
      prisma as never,
      staffAccess as never,
    );

    await expect(
      handler.execute(
        new GetDentalPatientsQuery('clerk-1', {
          organizationDentalClinicId: 'clinic-1',
          page: 1,
          pageSize: 20,
        }),
      ),
    ).rejects.toBe(error);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not return or search private profile fields for dentists', async () => {
    const findMany = jest.fn().mockResolvedValue([{
      patientNumber: '12',
      personDentalPatient: {
        person: {
          id: 'person-1',
          firstName: 'Alice',
          lastName: 'Example',
        },
      },
    }]);
    const count = jest.fn().mockResolvedValue(1);
    const prisma = {
      personDentalPatientAffiliation: { findMany, count },
      $transaction: jest.fn().mockImplementation((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };
    const staffAccess = { verify: jest.fn().mockResolvedValue({ role: 'DENTIST' }) };
    const handler = new GetDentalPatientsHandler(prisma as never, staffAccess as never);

    const result = await handler.execute(new GetDentalPatientsQuery('dentist', {
      organizationDentalClinicId: 'clinic-1',
      search: 'Alice',
      page: 1,
      pageSize: 20,
    }));

    expect(result.patients).toEqual([{
      personId: 'person-1',
      patientNumber: '12',
      firstName: 'Alice',
      lastName: 'Example',
    }]);
    const args = findMany.mock.calls[0][0];
    expect(args.select.personDentalPatient.select.person.select).not.toHaveProperty('phone');
    expect(args.select.personDentalPatient.select.person.select).not.toHaveProperty('birthDate');
    expect(JSON.stringify(args.where)).not.toContain('identityDocuments');
    expect(JSON.stringify(args.where)).not.toContain('phone');
  });

});
