import { Prisma } from '@prisma/client';
import { CreateManyCommand } from './create-many.command';
import { CreateWorkScheduleSlotHandler } from './create-many.handler';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';

describe('CreateWorkScheduleSlotHandler', () => {
  const positionId = '018f6c5e-8557-7888-8123-456789abcdef';
  const staffId = '018f6c5e-8557-7888-8123-456789000001';
  const otherStaffId = '018f6c5e-8557-7888-8123-456789000002';
  const start = '2026-10-24T08:00:00.000Z';
  const end = '2026-10-24T12:00:00.000Z';

  const tx = {
    $queryRaw: jest.fn(),
    workScheduleSlot: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    workScheduleHoliday: { findMany: jest.fn() },
    workScheduleMinMax: { findMany: jest.fn() },
  };
  const prisma = {
    workScheduleStaffPosition: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const accessControlService = {
    verifyWorkSchedulePositionByWorkScheduleAdmin: jest.fn(),
  };
  let handler: CreateWorkScheduleSlotHandler;

  function command(
    slots: Array<{
      staff_id: string;
      slot_type_id: string;
      actual_start_time: string;
      actual_end_time: string;
    }> = [
      {
        staff_id: staffId,
        slot_type_id: '018f6c5e-8557-7888-8123-456789000003',
        actual_start_time: start,
        actual_end_time: end,
      },
    ],
  ) {
    return new CreateManyCommand(
      'clerk-1',
      { position_id: positionId },
      { slots },
    );
  }

  function holiday(
    workScheduleStaffId: string,
    holidayStart: string,
    holidayEnd: string,
  ) {
    return {
      workScheduleStaffId,
      startTime: new Date(holidayStart),
      endTime: new Date(holidayEnd),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    tx.workScheduleSlot.findMany.mockResolvedValue([]);
    tx.workScheduleSlot.createMany.mockResolvedValue({ count: 1 });
    tx.workScheduleHoliday.findMany.mockResolvedValue([]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([]);
    prisma.workScheduleStaffPosition.findMany.mockResolvedValue([
      { workScheduleStaffId: staffId },
    ]);
    prisma.$transaction.mockImplementation(
      (operation: (client: unknown) => Promise<unknown>) => operation(tx),
    );
    handler = new CreateWorkScheduleSlotHandler(
      prisma as never,
      accessControlService as never,
    );
  });

  it('creates slots when no holiday overlaps', async () => {
    await expect(handler.execute(command())).resolves.toBeUndefined();

    expect(tx.workScheduleHoliday.findMany).toHaveBeenCalledWith({
      where: {
        workScheduleStaffId: { in: [staffId] },
        startTime: { lt: new Date(end) },
        endTime: { gt: new Date(start) },
      },
      select: {
        workScheduleStaffId: true,
        startTime: true,
        endTime: true,
      },
    });
    expect(tx.workScheduleSlot.createMany).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it.each([
    ['partial overlap', '2026-10-24T11:00:00.000Z', '2026-10-24T14:00:00.000Z'],
    ['full coverage', '2026-10-24T07:00:00.000Z', '2026-10-24T13:00:00.000Z'],
  ])(
    'rejects a %s holiday overlap before insert',
    async (_, holidayStart, holidayEnd) => {
      tx.workScheduleHoliday.findMany.mockResolvedValue([
        holiday(staffId, holidayStart, holidayEnd),
      ]);

      await expect(handler.execute(command())).rejects.toMatchObject({
        errorCode: ErrorCode.WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP,
        status: 409,
      });

      expect(tx.workScheduleSlot.createMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    },
  );

  it('ignores a holiday belonging to a different staff member', async () => {
    tx.workScheduleHoliday.findMany.mockResolvedValue([
      holiday(otherStaffId, start, end),
    ]);

    await expect(handler.execute(command())).resolves.toBeUndefined();
    expect(tx.workScheduleSlot.createMany).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      'slot ends at holiday start',
      start,
      '2026-10-24T10:00:00.000Z',
      '2026-10-24T10:00:00.000Z',
      '2026-10-24T13:00:00.000Z',
    ],
    [
      'slot starts at holiday end',
      '2026-10-24T13:00:00.000Z',
      end,
      '2026-10-24T10:00:00.000Z',
      '2026-10-24T13:00:00.000Z',
    ],
  ])(
    'allows touching half-open boundaries (%s)',
    async (_, slotStart, slotEnd, holidayStart, holidayEnd) => {
      tx.workScheduleHoliday.findMany.mockResolvedValue([
        holiday(staffId, holidayStart, holidayEnd),
      ]);

      await expect(
        handler.execute(
          command([
            {
              staff_id: staffId,
              slot_type_id: '018f6c5e-8557-7888-8123-456789000003',
              actual_start_time: slotStart,
              actual_end_time: slotEnd,
            },
          ]),
        ),
      ).resolves.toBeUndefined();
      expect(tx.workScheduleSlot.createMany).toHaveBeenCalledTimes(1);
    },
  );

  it('rejects the entire batch when only one slot overlaps a holiday', async () => {
    const secondStaff = otherStaffId;
    prisma.workScheduleStaffPosition.findMany.mockResolvedValue([
      { workScheduleStaffId: staffId },
      { workScheduleStaffId: secondStaff },
    ]);
    tx.workScheduleHoliday.findMany.mockResolvedValue([
      holiday(secondStaff, start, end),
    ]);

    await expect(
      handler.execute(
        command([
          {
            staff_id: staffId,
            slot_type_id: '018f6c5e-8557-7888-8123-456789000003',
            actual_start_time: start,
            actual_end_time: end,
          },
          {
            staff_id: secondStaff,
            slot_type_id: '018f6c5e-8557-7888-8123-456789000003',
            actual_start_time: start,
            actual_end_time: end,
          },
        ]),
      ),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP,
      status: 409,
    });
    expect(tx.workScheduleSlot.createMany).not.toHaveBeenCalled();
  });

  it('retries a P2034 with a fresh Serializable transaction and checks holidays again', async () => {
    let attempt = 0;
    const serializationError = Object.assign(
      new Error('Serialization failure'),
      {
        code: 'P2034',
      },
    );
    prisma.$transaction.mockImplementation(
      (operation: (client: unknown) => Promise<unknown>) => {
        attempt++;
        return operation(tx).then((result) => {
          if (attempt === 1) throw serializationError;
          return result;
        });
      },
    );

    await expect(handler.execute(command())).resolves.toBeUndefined();

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(tx.workScheduleHoliday.findMany).toHaveBeenCalledTimes(2);
    expect(tx.workScheduleSlot.findMany).toHaveBeenCalledTimes(2);
    expect(tx.workScheduleMinMax.findMany).toHaveBeenCalledTimes(2);
    for (const [, options] of prisma.$transaction.mock.calls) {
      expect(options).toEqual({
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    }
  });

  it('does not retry a holiday validation conflict', async () => {
    tx.workScheduleHoliday.findMany.mockResolvedValue([
      holiday(staffId, start, end),
    ]);

    await expect(handler.execute(command())).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
