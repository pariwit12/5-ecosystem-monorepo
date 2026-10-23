import { ListMyHolidaysHandler } from './list-my-holidays.handler';
import { ListMyHolidaysQuery } from './list-my-holidays.query';

describe('ListMyHolidaysHandler', () => {
  const prisma = {
    workScheduleHoliday: {
      findMany: jest.fn(),
    },
  };

  const accessControlService = {
    verifyWorkScheduleStaffAccess: jest.fn(),
  };

  let handler: ListMyHolidaysHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new ListMyHolidaysHandler(
      prisma as never,
      accessControlService as never,
    );
  });

  const validPlaceId = '018f6c5e-8557-7888-8123-456789abcdef';
  const staffId = '018f6c5e-8557-7888-8123-456789000001';

  it('returns only holidays of current staff ordered by startTime asc', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId,
    });

    const mockHolidays = [
      {
        id: 'h-1',
        startTime: new Date('2026-10-24T00:00:00.000Z'),
        endTime: new Date('2026-10-25T00:00:00.000Z'),
        createdAt: new Date('2026-10-20T10:00:00.000Z'),
      },
      {
        id: 'h-2',
        startTime: new Date('2026-10-28T09:00:00.000Z'),
        endTime: new Date('2026-10-28T12:00:00.000Z'),
        createdAt: new Date('2026-10-21T10:00:00.000Z'),
      },
    ];

    prisma.workScheduleHoliday.findMany.mockResolvedValue(mockHolidays);

    const result = await handler.execute(
      new ListMyHolidaysQuery('clerk-1', {
        place_id: validPlaceId,
      }),
    );

    expect(prisma.workScheduleHoliday.findMany).toHaveBeenCalledWith({
      where: { workScheduleStaffId: staffId },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        createdAt: true,
      },
    });

    expect(result).toEqual({
      holidays: [
        {
          id: 'h-1',
          startTime: '2026-10-24T00:00:00.000Z',
          endTime: '2026-10-25T00:00:00.000Z',
          createdAt: '2026-10-20T10:00:00.000Z',
        },
        {
          id: 'h-2',
          startTime: '2026-10-28T09:00:00.000Z',
          endTime: '2026-10-28T12:00:00.000Z',
          createdAt: '2026-10-21T10:00:00.000Z',
        },
      ],
    });
  });
});
