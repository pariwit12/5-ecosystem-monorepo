import { Prisma } from '@prisma/client';
import { CreateHolidayHandler } from './create-holiday.handler';
import { CreateHolidayCommand } from './create-holiday.command';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { AppException } from '../../../../common/exceptions/app.exception';

type PlaceRecord = {
  deletedAt: Date | null;
  organizationWorkSchedulePlaceId: string;
};

type StaffPosition = {
  workScheduleStaffId: string;
  workSchedulePositionId: string;
  deletedAt: Date | null;
  workScheduleStaff: PlaceRecord;
  workSchedulePosition: PlaceRecord;
};

type StaffPositionWhere = {
  workScheduleStaffId?: string;
  workSchedulePositionId?: { in: string[] };
  deletedAt?: null;
  workScheduleStaff?: Partial<PlaceRecord>;
  workSchedulePosition?: Partial<PlaceRecord>;
};

type Interval = { startTime: Date; endTime: Date };
type MinMax = Interval & {
  workSchedulePositionId: string;
  min: number | null;
  max: number | null;
};
type Holiday = Interval & { workScheduleStaffId: string };
type OverlapWhere = { startTime: { lt: Date }; endTime: { gt: Date } };

describe('CreateHolidayHandler', () => {
  const validPlaceId = '018f6c5e-8557-7888-8123-456789abcdef';
  const staffId = '018f6c5e-8557-7888-8123-456789000001';
  const otherStaffId = '018f6c5e-8557-7888-8123-456789000002';
  const thirdStaffId = '018f6c5e-8557-7888-8123-456789000003';
  const positionId = 'position-1';
  const secondPositionId = 'position-2';
  const minErrorMessage =
    'ไม่สามารถบันทึกวันหยุดได้ เนื่องจากจำนวนพนักงานที่พร้อมทำงานจะต่ำกว่าจำนวนขั้นต่ำ (Min) ในช่วงเวลานี้';
  const time = (value: string) => new Date(`2026-10-24T${value}:00.000Z`);
  const activeInPlace = {
    deletedAt: null,
    organizationWorkSchedulePlaceId: validPlaceId,
  };
  const link = (
    id: string,
    workSchedulePositionId = positionId,
  ): StaffPosition => ({
    workScheduleStaffId: id,
    workSchedulePositionId,
    deletedAt: null,
    workScheduleStaff: { ...activeInPlace },
    workSchedulePosition: { ...activeInPlace },
  });
  const rule = (
    min: number | null = 1,
    start = '02:00',
    end = '05:00',
    workSchedulePositionId = positionId,
  ): MinMax => ({
    workSchedulePositionId,
    min,
    max: null,
    startTime: time(start),
    endTime: time(end),
  });
  const holiday = (id: string, start = '02:00', end = '05:00'): Holiday => ({
    workScheduleStaffId: id,
    startTime: time(start),
    endTime: time(end),
  });
  const partialCommand = (start = '02:00', end = '05:00') =>
    new CreateHolidayCommand(
      'clerk-1',
      { place_id: validPlaceId },
      {
        type: 'PARTIAL',
        start_time: time(start).toISOString(),
        end_time: time(end).toISOString(),
      },
    );
  const fullDayCommand = (date = '2026-10-24') =>
    new CreateHolidayCommand(
      'clerk-1',
      { place_id: validPlaceId },
      { type: 'FULL_DAY', date },
    );
  const matchesPlace = (record: PlaceRecord, filter?: Partial<PlaceRecord>) =>
    (filter?.deletedAt !== null || record.deletedAt === null) &&
    (filter?.organizationWorkSchedulePlaceId === undefined ||
      record.organizationWorkSchedulePlaceId ===
        filter.organizationWorkSchedulePlaceId);
  const overlapsQuery = (interval: Interval, where: OverlapWhere) =>
    interval.startTime < where.startTime.lt &&
    interval.endTime > where.endTime.gt;

  let links: StaffPosition[];
  let rules: MinMax[];
  let holidays: Holiday[];

  const txMock = {
    workScheduleSlot: { findFirst: jest.fn() },
    workScheduleStaffPosition: { findMany: jest.fn() },
    workScheduleMinMax: { findMany: jest.fn() },
    workScheduleHoliday: { findMany: jest.fn(), create: jest.fn() },
  };
  const prisma = {
    organizationWorkSchedulePlace: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  const accessControlService = {
    verifyWorkScheduleStaffAccess: jest.fn(),
  };
  let handler: CreateHolidayHandler;

  beforeEach(() => {
    jest.resetAllMocks();
    links = [link(staffId), link(otherStaffId)];
    rules = [rule()];
    holidays = [];
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId,
    });
    prisma.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
      timezone: 'Asia/Bangkok',
    });
    txMock.workScheduleSlot.findFirst.mockResolvedValue(null);
    // Apply the filters supplied by the handler so excluded records in fixtures
    // cannot silently inflate headcounts or introduce unrelated absences.
    txMock.workScheduleStaffPosition.findMany.mockImplementation(
      ({ where }: { where: StaffPositionWhere }) =>
        Promise.resolve(
          links.filter(
            (entry) =>
              (where.workScheduleStaffId === undefined ||
                entry.workScheduleStaffId === where.workScheduleStaffId) &&
              (where.workSchedulePositionId === undefined ||
                where.workSchedulePositionId.in.includes(
                  entry.workSchedulePositionId,
                )) &&
              (where.deletedAt !== null || entry.deletedAt === null) &&
              matchesPlace(entry.workScheduleStaff, where.workScheduleStaff) &&
              matchesPlace(
                entry.workSchedulePosition,
                where.workSchedulePosition,
              ),
          ),
        ),
    );
    txMock.workScheduleMinMax.findMany.mockImplementation(
      ({
        where,
      }: {
        where: OverlapWhere & {
          workSchedulePositionId: { in: string[] };
          min?: { not: null };
        };
      }) =>
        Promise.resolve(
          rules.filter(
            (entry) =>
              where.workSchedulePositionId.in.includes(
                entry.workSchedulePositionId,
              ) &&
              (where.min?.not !== null || entry.min !== null) &&
              overlapsQuery(entry, where),
          ),
        ),
    );
    txMock.workScheduleHoliday.findMany.mockImplementation(
      ({
        where,
      }: {
        where: OverlapWhere & { workScheduleStaffId: { in: string[] } };
      }) =>
        Promise.resolve(
          holidays.filter(
            (entry) =>
              where.workScheduleStaffId.in.includes(
                entry.workScheduleStaffId,
              ) && overlapsQuery(entry, where),
          ),
        ),
    );
    txMock.workScheduleHoliday.create.mockImplementation(
      ({ data }: { data: Holiday }) =>
        Promise.resolve({
          id: 'holiday-1',
          ...data,
          createdAt: new Date('2026-10-23T10:00:00.000Z'),
        }),
    );
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock),
    );
    handler = new CreateHolidayHandler(
      prisma as never,
      accessControlService as never,
    );
  });

  async function expectMinConflict(command = partialCommand()) {
    const result = handler.execute(command);
    await expect(result).rejects.toBeInstanceOf(AppException);
    await expect(result).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_HOLIDAY_MIN_STAFF_NOT_ENOUGH,
      message: minErrorMessage,
      status: 409,
    });
    expect(txMock.workScheduleHoliday.create).not.toHaveBeenCalled();
  }

  it('creates a full-day holiday using local midnight and checks Min with the same UTC interval', async () => {
    const result = await handler.execute(fullDayCommand());
    const startTime = new Date('2026-10-23T17:00:00.000Z');
    const endTime = new Date('2026-10-24T17:00:00.000Z');

    expect(result.startTime).toBe(startTime.toISOString());
    expect(result.endTime).toBe(endTime.toISOString());
    expect(txMock.workScheduleSlot.findFirst).toHaveBeenCalledWith({
      where: {
        staffId,
        actualStartTime: { lt: endTime },
        actualEndTime: { gt: startTime },
      },
      select: { id: true },
    });
    expect(txMock.workScheduleMinMax.findMany).toHaveBeenCalledWith({
      where: {
        workSchedulePositionId: { in: [positionId] },
        min: { not: null },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: {
        workSchedulePositionId: true,
        min: true,
        startTime: true,
        endTime: true,
      },
    });
  });

  it('keeps the 23-hour full-day interval across America/New_York spring DST', async () => {
    prisma.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
      timezone: 'America/New_York',
    });
    rules = [
      {
        ...rule(),
        startTime: new Date('2026-03-08T05:00:00.000Z'),
        endTime: new Date('2026-03-09T04:00:00.000Z'),
      },
    ];

    const result = await handler.execute(fullDayCommand('2026-03-08'));

    expect(result.startTime).toBe('2026-03-08T05:00:00.000Z');
    expect(result.endTime).toBe('2026-03-09T04:00:00.000Z');
    expect(txMock.workScheduleHoliday.findMany).toHaveBeenCalledWith({
      where: {
        workScheduleStaffId: { in: [staffId, otherStaffId] },
        startTime: { lt: new Date(result.endTime) },
        endTime: { gt: new Date(result.startTime) },
      },
      select: { workScheduleStaffId: true, startTime: true, endTime: true },
    });
  });

  it('creates a partial holiday with the supplied ISO offset and preserves the response', async () => {
    const result = await handler.execute(
      new CreateHolidayCommand(
        'clerk-1',
        { place_id: validPlaceId },
        {
          type: 'PARTIAL',
          start_time: '2026-10-24T09:00:00+07:00',
          end_time: '2026-10-24T12:00:00+07:00',
        },
      ),
    );

    expect(result).toEqual({
      id: 'holiday-1',
      startTime: '2026-10-24T02:00:00.000Z',
      endTime: '2026-10-24T05:00:00.000Z',
      createdAt: '2026-10-23T10:00:00.000Z',
    });
    expect(
      accessControlService.verifyWorkScheduleStaffAccess,
    ).toHaveBeenCalledWith('clerk-1', validPlaceId);
    expect(
      prisma.organizationWorkSchedulePlace.findUnique,
    ).not.toHaveBeenCalled();
    expect(txMock.workScheduleHoliday.create).toHaveBeenCalledWith({
      data: {
        workScheduleStaffId: staffId,
        startTime: time('02:00'),
        endTime: time('05:00'),
      },
      select: { id: true, startTime: true, endTime: true, createdAt: true },
    });
  });

  it('allows exactly Min active staff after counting the new holiday inside the transaction', async () => {
    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(txMock.workScheduleStaffPosition.findMany).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          workScheduleStaffId: staffId,
          deletedAt: null,
          workScheduleStaff: activeInPlace,
          workSchedulePosition: activeInPlace,
        },
        select: { workSchedulePositionId: true },
      },
    );
    expect(txMock.workScheduleStaffPosition.findMany).toHaveBeenNthCalledWith(
      2,
      {
        where: {
          workSchedulePositionId: { in: [positionId] },
          deletedAt: null,
          workScheduleStaff: activeInPlace,
          workSchedulePosition: activeInPlace,
        },
        select: { workScheduleStaffId: true, workSchedulePositionId: true },
      },
    );
    expect(txMock.workScheduleHoliday.findMany).toHaveBeenCalledWith({
      where: {
        workScheduleStaffId: { in: [staffId, otherStaffId] },
        startTime: { lt: time('05:00') },
        endTime: { gt: time('02:00') },
      },
      select: { workScheduleStaffId: true, startTime: true, endTime: true },
    });
    expect(
      txMock.workScheduleHoliday.findMany.mock.invocationCallOrder[0],
    ).toBeLessThan(
      txMock.workScheduleHoliday.create.mock.invocationCallOrder[0],
    );
    expect(txMock.workScheduleHoliday.create).toHaveBeenCalledTimes(1);
  });

  it('rejects below Min before create and does not retry a business conflict', async () => {
    rules = [rule(2)];

    await expectMinConflict();

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('skips Min checks when the requester has no positions', async () => {
    links = [link(otherStaffId)];

    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );

    expect(txMock.workScheduleMinMax.findMany).not.toHaveBeenCalled();
    expect(txMock.workScheduleHoliday.findMany).not.toHaveBeenCalled();
  });

  it.each([
    ['no MinMax', []],
    ['only Max with null Min', [{ ...rule(null), max: 0 }]],
    ['MinMax ending at the holiday start', [rule(99, '01:00', '02:00')]],
    ['MinMax starting at the holiday end', [rule(99, '05:00', '06:00')]],
    [
      'MinMax for another position',
      [rule(99, '02:00', '05:00', secondPositionId)],
    ],
  ])('skips staffing queries for %s', async (_name, configuredRules) => {
    rules = configuredRules;
    links = [link(staffId)];

    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );

    expect(txMock.workScheduleStaffPosition.findMany).toHaveBeenCalledTimes(1);
    expect(txMock.workScheduleHoliday.findMany).not.toHaveBeenCalled();
  });

  it('allows Min zero when the new holiday leaves nobody available, regardless of Max', async () => {
    links = [link(staffId)];
    rules = [{ ...rule(0), max: 0 }];

    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );
  });

  it('subtracts existing holidays as well as the requester new holiday', async () => {
    holidays = [holiday(otherStaffId)];

    await expectMinConflict();
  });

  it('counts overlapping duplicate holidays for the requester and another staff member only once each', async () => {
    links.push(link(thirdStaffId));
    holidays = [
      holiday(staffId),
      holiday(staffId, '03:00', '04:00'),
      holiday(otherStaffId),
      holiday(otherStaffId, '03:00', '04:00'),
    ];

    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );
  });

  it('counts a staff member with duplicate returned position links only once', async () => {
    links.push(link(otherStaffId));
    rules = [rule(2)];

    await expectMinConflict();
  });

  it.each([
    ['ending at the holiday start', '01:00', '02:00'],
    ['starting at the holiday end', '05:00', '06:00'],
  ])('does not subtract an existing holiday %s', async (_name, start, end) => {
    holidays = [holiday(otherStaffId, start, end)];

    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );
  });

  it('allows adjacent holidays of different staff when each subinterval still has Min available', async () => {
    links.push(link(thirdStaffId));
    holidays = [
      holiday(otherStaffId, '02:00', '03:00'),
      holiday(thirdStaffId, '03:00', '05:00'),
    ];

    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );
  });

  it('rejects simultaneous holidays of different staff in even a short subinterval', async () => {
    links.push(link(thirdStaffId));
    holidays = [
      holiday(otherStaffId, '02:00', '03:30'),
      holiday(thirdStaffId, '03:00', '05:00'),
    ];

    await expectMinConflict();
  });

  it('allows a partial request when the shortage is only outside its intersection with MinMax', async () => {
    rules = [rule(1, '01:00', '06:00')];
    holidays = [
      holiday(staffId, '01:00', '02:00'),
      holiday(otherStaffId, '01:00', '02:00'),
      holiday(staffId, '05:00', '06:00'),
      holiday(otherStaffId, '05:00', '06:00'),
    ];

    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );
  });

  it('rejects a partial request when a shortage occurs within the intersection with MinMax', async () => {
    rules = [rule(1, '01:00', '06:00')];
    holidays = [holiday(otherStaffId, '04:00', '05:30')];

    await expectMinConflict();
  });

  it('clips evaluation to MinMax boundaries even when the requested holiday is longer', async () => {
    rules = [rule(1, '03:00', '04:00')];
    holidays = [
      holiday(otherStaffId, '02:00', '03:00'),
      holiday(otherStaffId, '04:00', '05:00'),
    ];

    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );
  });

  it('checks every overlapping MinMax rule for a position', async () => {
    rules = [rule(1, '01:00', '03:00'), rule(2, '04:00', '06:00')];

    await expectMinConflict();
  });

  it('rejects when any requester position is short without counting staff from another position', async () => {
    links.push(link(staffId, secondPositionId), link(thirdStaffId));
    rules.push(rule(1, '02:00', '05:00', secondPositionId));

    await expectMinConflict();

    expect(txMock.workScheduleMinMax.findMany).toHaveBeenCalledWith({
      where: {
        workSchedulePositionId: { in: [positionId, secondPositionId] },
        min: { not: null },
        startTime: { lt: time('05:00') },
        endTime: { gt: time('02:00') },
      },
      select: {
        workSchedulePositionId: true,
        min: true,
        startTime: true,
        endTime: true,
      },
    });
  });

  it('allows multiple requester positions when each position independently satisfies Min', async () => {
    links.push(
      link(staffId, secondPositionId),
      link(thirdStaffId, secondPositionId),
    );
    rules.push(rule(1, '03:00', '04:00', secondPositionId));
    holidays = [holiday(otherStaffId, '05:00', '06:00')];

    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );
  });

  const excludedLinkCases: [string, (entry: StaffPosition) => void][] = [
    [
      'soft-deleted link',
      (entry) => {
        entry.deletedAt = time('00:00');
      },
    ],
    [
      'soft-deleted staff',
      (entry) => {
        entry.workScheduleStaff.deletedAt = time('00:00');
      },
    ],
    [
      'soft-deleted position',
      (entry) => {
        entry.workSchedulePosition.deletedAt = time('00:00');
      },
    ],
    [
      'staff from another place',
      (entry) => {
        entry.workScheduleStaff.organizationWorkSchedulePlaceId = 'other-place';
      },
    ],
    [
      'position from another place',
      (entry) => {
        entry.workSchedulePosition.organizationWorkSchedulePlaceId =
          'other-place';
      },
    ],
  ];

  it.each(excludedLinkCases)(
    'ignores a requester %s when selecting applicable MinMax',
    async (_name, exclude) => {
      links = [link(staffId)];
      exclude(links[0]);
      rules = [rule(99)];

      await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
        'id',
      );

      expect(txMock.workScheduleMinMax.findMany).not.toHaveBeenCalled();
    },
  );

  it.each(excludedLinkCases)(
    'does not count an eligible %s as available staff',
    async (_name, exclude) => {
      exclude(links[1]);

      await expectMinConflict();

      expect(txMock.workScheduleHoliday.findMany).toHaveBeenCalledWith({
        where: {
          workScheduleStaffId: { in: [staffId] },
          startTime: { lt: time('05:00') },
          endTime: { gt: time('02:00') },
        },
        select: { workScheduleStaffId: true, startTime: true, endTime: true },
      });
    },
  );

  it('does not subtract holidays of staff outside the eligible active position links', async () => {
    const deletedStaffLink = link(thirdStaffId);
    deletedStaffLink.workScheduleStaff.deletedAt = time('00:00');
    links.push(deletedStaffLink, link('unrelated-staff', secondPositionId));
    holidays = [holiday(thirdStaffId), holiday('unrelated-staff')];

    await expect(handler.execute(partialCommand())).resolves.toHaveProperty(
      'id',
    );

    expect(txMock.workScheduleHoliday.findMany).toHaveBeenCalledWith({
      where: {
        workScheduleStaffId: { in: [staffId, otherStaffId] },
        startTime: { lt: time('05:00') },
        endTime: { gt: time('02:00') },
      },
      select: { workScheduleStaffId: true, startTime: true, endTime: true },
    });
  });

  it('preserves slot-overlap rejection before staffing checks or insertion', async () => {
    txMock.workScheduleSlot.findFirst.mockResolvedValue({
      id: 'existing-slot',
    });

    await expect(handler.execute(fullDayCommand())).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_HOLIDAY_SLOT_OVERLAP,
      message:
        'ไม่สามารถบันทึกวันหยุดได้เนื่องจากช่วงเวลาทับซ้อนกับเวรการทำงานที่คุณมีอยู่',
      status: 409,
    });

    expect(txMock.workScheduleStaffPosition.findMany).not.toHaveBeenCalled();
    expect(txMock.workScheduleHoliday.create).not.toHaveBeenCalled();
  });

  it('retries P2034 serialization failures and succeeds on the third retry', async () => {
    const serializationError = Object.assign(
      new Error('Serialization failure'),
      {
        code: 'P2034',
      },
    );
    prisma.$transaction
      .mockRejectedValueOnce(serializationError)
      .mockRejectedValueOnce(serializationError)
      .mockRejectedValueOnce(serializationError);

    await expect(handler.execute(fullDayCommand())).resolves.toHaveProperty(
      'id',
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(4);
    expect(txMock.workScheduleHoliday.create).toHaveBeenCalledTimes(1);
  });

  it('returns a conflict after the initial attempt and all three P2034 retries fail', async () => {
    prisma.$transaction.mockRejectedValue(
      Object.assign(new Error('Serialization failure'), { code: 'P2034' }),
    );

    await expect(handler.execute(partialCommand())).rejects.toMatchObject({
      errorCode: ErrorCode.DEFAULT_ERROR,
      status: 409,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(4);
    expect(txMock.workScheduleHoliday.create).not.toHaveBeenCalled();
  });

  it('recalculates Min from fresh holiday reads after P2034 and rejects a newly insufficient retry', async () => {
    txMock.workScheduleHoliday.create.mockImplementationOnce(() => {
      // A concurrent holiday is visible when the serializable transaction retries.
      holidays.push(holiday(otherStaffId));
      return Promise.reject(
        Object.assign(new Error('Serialization failure'), { code: 'P2034' }),
      );
    });

    await expect(handler.execute(partialCommand())).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_HOLIDAY_MIN_STAFF_NOT_ENOUGH,
      status: 409,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(txMock.workScheduleStaffPosition.findMany).toHaveBeenCalledTimes(4);
    expect(txMock.workScheduleMinMax.findMany).toHaveBeenCalledTimes(2);
    expect(txMock.workScheduleHoliday.findMany).toHaveBeenCalledTimes(2);
    // The first attempt failed; the rejected second attempt never reaches create.
    expect(txMock.workScheduleHoliday.create).toHaveBeenCalledTimes(1);
  });
});
