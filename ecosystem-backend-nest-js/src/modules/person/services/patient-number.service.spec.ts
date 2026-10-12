import { PatientNumberService } from './patient-number.service';

describe('PatientNumberService', () => {
  type TransactionClient = {
    patientNumberSequence: {
      upsert: jest.Mock<Promise<{ nextNumber: number }>>;
    };
  };

  it('allocates the first number for a clinic', async () => {
    const tx: TransactionClient = {
      patientNumberSequence: {
        upsert: jest
          .fn<Promise<{ nextNumber: number }>, []>()
          .mockResolvedValue({ nextNumber: 2 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: TransactionClient) => Promise<string>) =>
          callback(tx),
      ),
    };
    const service = new PatientNumberService(prisma as never);

    await expect(service.allocateNext('clinic-1')).resolves.toBe('1');
  });

  it('allocates the next number from an existing sequence', async () => {
    const upsert = jest
      .fn<Promise<{ nextNumber: number }>, []>()
      .mockResolvedValue({ nextNumber: 8 });
    const tx: TransactionClient = { patientNumberSequence: { upsert } };
    const prisma = {
      $transaction: jest.fn(
        (callback: (client: TransactionClient) => Promise<string>) =>
          callback(tx),
      ),
    };
    const service = new PatientNumberService(prisma as never);

    await expect(service.allocateNext('clinic-1')).resolves.toBe('7');
    expect(upsert).toHaveBeenCalledWith({
      where: { organizationDentalClinicId: 'clinic-1' },
      create: { organizationDentalClinicId: 'clinic-1', nextNumber: 2 },
      update: { nextNumber: { increment: 1 } },
      select: { nextNumber: true },
    });
  });

  it('can allocate inside a caller-owned transaction', async () => {
    const upsert = jest
      .fn<Promise<{ nextNumber: number }>, []>()
      .mockResolvedValue({ nextNumber: 3 });
    const service = new PatientNumberService({} as never);

    await expect(
      service.allocateNextInTransaction(
        { patientNumberSequence: { upsert } } as never,
        'clinic-1',
      ),
    ).resolves.toBe('2');
  });
});
