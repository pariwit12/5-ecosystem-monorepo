import { CreateHolidayHandler } from './create-holiday.handler';
import { CreateHolidayCommand } from './create-holiday.command';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { AppException } from '../../../../common/exceptions/app.exception';

describe('CreateHolidayHandler', () => {
  const prisma = {
    organizationWorkSchedulePlace: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const accessControlService = {
    verifyWorkScheduleStaffAccess: jest.fn(),
  };

  let handler: CreateHolidayHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new CreateHolidayHandler(
      prisma as never,
      accessControlService as never,
    );
  });

  const validPlaceId = '018f6c5e-8557-7888-8123-456789abcdef';
  const staffId = '018f6c5e-8557-7888-8123-456789000001';

  it('successfully creates full-day holiday with local timezone midnight to next local midnight', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId,
    });

    // Place timezone: Asia/Bangkok (UTC+7)
    prisma.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
      timezone: 'Asia/Bangkok',
    });

    const txMock = {
      workScheduleSlot: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      workScheduleHoliday: {
        create: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: { startTime: Date; endTime: Date } }) => ({
              id: 'holiday-1',
              startTime: data.startTime,
              endTime: data.endTime,
              createdAt: new Date('2026-10-23T10:00:00.000Z'),
            }),
          ),
      },
    };

    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock),
    );

    const result = await handler.execute(
      new CreateHolidayCommand(
        'clerk-1',
        { place_id: validPlaceId },
        {
          type: 'FULL_DAY',
          date: '2026-10-24',
        },
      ),
    );

    // 2026-10-24 00:00:00+07:00 = 2026-10-23T17:00:00.000Z
    // 2026-10-25 00:00:00+07:00 = 2026-10-24T17:00:00.000Z
    expect(result.startTime).toBe('2026-10-23T17:00:00.000Z');
    expect(result.endTime).toBe('2026-10-24T17:00:00.000Z');

    expect(txMock.workScheduleSlot.findFirst).toHaveBeenCalledWith({
      where: {
        staffId,
        actualStartTime: { lt: new Date('2026-10-24T17:00:00.000Z') },
        actualEndTime: { gt: new Date('2026-10-23T17:00:00.000Z') },
      },
      select: { id: true },
    });
  });

  it('correctly handles full-day in timezone with DST (e.g. America/New_York)', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId,
    });

    // America/New_York on 2026-03-08 is spring forward (23h day)
    prisma.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
      timezone: 'America/New_York',
    });

    const txMock = {
      workScheduleSlot: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      workScheduleHoliday: {
        create: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: { startTime: Date; endTime: Date } }) => ({
              id: 'holiday-dst',
              startTime: data.startTime,
              endTime: data.endTime,
              createdAt: new Date('2026-03-01T10:00:00.000Z'),
            }),
          ),
      },
    };

    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock),
    );

    const result = await handler.execute(
      new CreateHolidayCommand(
        'clerk-1',
        { place_id: validPlaceId },
        {
          type: 'FULL_DAY',
          date: '2026-03-08',
        },
      ),
    );

    // 2026-03-08 midnight is EST (UTC-5) -> 2026-03-08T05:00:00Z
    // 2026-03-09 midnight is EDT (UTC-4) -> 2026-03-09T04:00:00Z (23 hours duration)
    expect(result.startTime).toBe('2026-03-08T05:00:00.000Z');
    expect(result.endTime).toBe('2026-03-09T04:00:00.000Z');
  });

  it('successfully creates partial holiday with provided ISO string with offset', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId,
    });

    const txMock = {
      workScheduleSlot: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      workScheduleHoliday: {
        create: jest
          .fn()
          .mockImplementation(
            ({ data }: { data: { startTime: Date; endTime: Date } }) => ({
              id: 'holiday-2',
              startTime: data.startTime,
              endTime: data.endTime,
              createdAt: new Date('2026-10-23T10:00:00.000Z'),
            }),
          ),
      },
    };

    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock),
    );

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

    expect(result.startTime).toBe('2026-10-24T02:00:00.000Z');
    expect(result.endTime).toBe('2026-10-24T05:00:00.000Z');
  });

  it('rejects with WORK_SCHEDULE_HOLIDAY_SLOT_OVERLAP if overlapping slot found', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId,
    });

    prisma.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
      timezone: 'Asia/Bangkok',
    });

    const txMock = {
      workScheduleSlot: {
        findFirst: jest.fn().mockResolvedValue({ id: 'existing-slot-id' }),
      },
      workScheduleHoliday: {
        create: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock),
    );

    await expect(
      handler.execute(
        new CreateHolidayCommand(
          'clerk-1',
          { place_id: validPlaceId },
          {
            type: 'FULL_DAY',
            date: '2026-10-24',
          },
        ),
      ),
    ).rejects.toThrow(
      new AppException(
        ErrorCode.WORK_SCHEDULE_HOLIDAY_SLOT_OVERLAP,
        'ไม่สามารถบันทึกวันหยุดได้เนื่องจากช่วงเวลาทับซ้อนกับเวรการทำงานที่คุณมีอยู่',
        409,
      ),
    );

    expect(txMock.workScheduleHoliday.create).not.toHaveBeenCalled();
  });

  it('retries on P2034 serialization failure up to 3 times', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId,
    });

    prisma.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
      timezone: 'Asia/Bangkok',
    });

    const txMock = {
      workScheduleSlot: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      workScheduleHoliday: {
        create: jest.fn().mockResolvedValue({
          id: 'holiday-retry',
          startTime: new Date('2026-10-24T00:00:00Z'),
          endTime: new Date('2026-10-25T00:00:00Z'),
          createdAt: new Date('2026-10-23T10:00:00Z'),
        }),
      },
    };

    let attempts = 0;
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof txMock) => Promise<unknown>) => {
        attempts++;
        if (attempts < 3) {
          const error = Object.assign(new Error('Serialization failure'), {
            code: 'P2034',
          });
          throw error;
        }
        return callback(txMock);
      },
    );

    const result = await handler.execute(
      new CreateHolidayCommand(
        'clerk-1',
        { place_id: validPlaceId },
        {
          type: 'FULL_DAY',
          date: '2026-10-24',
        },
      ),
    );

    expect(attempts).toBe(3);
    expect(result.id).toBe('holiday-retry');
  });
});
