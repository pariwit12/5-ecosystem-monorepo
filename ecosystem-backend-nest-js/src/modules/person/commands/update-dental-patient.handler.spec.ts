import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateDentalPatientCommand } from './update-dental-patient.command';
import { UpdateDentalPatientHandler } from './update-dental-patient.handler';

describe('UpdateDentalPatientHandler', () => {
  const staffAccess = {
    verify: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
  };

  beforeEach(() => jest.clearAllMocks());

  it('updates shared profile data using optimistic versioning', async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValue({ personDentalPatientId: 'person-1' });
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const handler = new UpdateDentalPatientHandler(
      {
        personDentalPatientAffiliation: { findUnique },
        person: { updateMany },
      } as never,
      staffAccess as never,
    );

    await expect(
      handler.execute(
        new UpdateDentalPatientCommand('clerk-1', 'person-1', 'clinic-1', {
          version: 2,
          phone: '0811111111',
        }),
      ),
    ).resolves.toEqual({ personId: 'person-1', version: 3 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'person-1', version: 2 },
      data: { phone: '0811111111', version: { increment: 1 } },
    });
  });

  it('rejects a person who is not a patient of the selected clinic', async () => {
    const handler = new UpdateDentalPatientHandler(
      {
        personDentalPatientAffiliation: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      } as never,
      staffAccess as never,
    );

    await expect(
      handler.execute(
        new UpdateDentalPatientCommand('clerk-1', 'person-1', 'clinic-1', {
          version: 1,
          firstName: 'ใหม่',
        }),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a stale update instead of overwriting newer data', async () => {
    const handler = new UpdateDentalPatientHandler(
      {
        personDentalPatientAffiliation: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ personDentalPatientId: 'person-1' }),
        },
        person: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      } as never,
      staffAccess as never,
    );

    await expect(
      handler.execute(
        new UpdateDentalPatientCommand('clerk-1', 'person-1', 'clinic-1', {
          version: 1,
          lastName: 'ข้อมูลเก่า',
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects profile updates by managers before writing', async () => {
    staffAccess.verify.mockResolvedValue({ role: 'MANAGER' });
    const findUnique = jest.fn();
    const updateMany = jest.fn();
    const handler = new UpdateDentalPatientHandler({
      personDentalPatientAffiliation: { findUnique },
      person: { updateMany },
    } as never, staffAccess as never);

    await expect(handler.execute(
      new UpdateDentalPatientCommand('manager', 'person-1', 'clinic-1', {
        version: 1,
        firstName: 'Not allowed',
      }),
    )).rejects.toMatchObject({ status: 403 });
    expect(findUnique).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('does not allow receptionists to change birth date', async () => {
    staffAccess.verify.mockResolvedValue({ role: 'RECEPTIONIST' });
    const findUnique = jest.fn();
    const updateMany = jest.fn();
    const handler = new UpdateDentalPatientHandler({
      personDentalPatientAffiliation: { findUnique },
      person: { updateMany },
    } as never, staffAccess as never);

    await expect(handler.execute(
      new UpdateDentalPatientCommand('receptionist', 'person-1', 'clinic-1', {
        version: 1,
        birthDate: new Date('1990-01-01'),
      }),
    )).rejects.toMatchObject({ status: 403 });
    expect(findUnique).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

});
