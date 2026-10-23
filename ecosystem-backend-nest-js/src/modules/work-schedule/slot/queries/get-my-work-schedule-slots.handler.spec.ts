import { GetMyWorkScheduleSlotsHandler } from './get-my-work-schedule-slots.handler';
import {
  GetMyWorkScheduleSlotsDtoQuerySchema,
  GetMyWorkScheduleSlotsQuery,
} from './get-my-work-schedule-slots.query';

describe('GetMyWorkScheduleSlotsHandler', () => {
  const prisma = { workScheduleSlot: { findMany: jest.fn() } };
  const accessControlService = { verifyWorkScheduleStaffAccess: jest.fn() };
  const placeId = '018f6c5e-8557-7888-8123-456789abcdef';
  const staffId = '018f6c5e-8557-7888-8123-456789000001';

  beforeEach(() => jest.clearAllMocks());

  it('uses the staff resolved by access control and returns overlapping slots ordered by time', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      staffId,
    });
    prisma.workScheduleSlot.findMany.mockResolvedValue([
      {
        id: 'slot-1',
        slotType: { name: 'เวรเช้า' },
        actualStartTime: new Date('2026-10-31T17:00:00.000Z'),
        actualEndTime: new Date('2026-11-01T02:00:00.000Z'),
      },
    ]);
    const handler = new GetMyWorkScheduleSlotsHandler(
      prisma as never,
      accessControlService as never,
    );

    const result = await handler.execute(
      new GetMyWorkScheduleSlotsQuery(
        'clerk-1',
        { place_id: placeId },
        {
          start_time: '2026-11-01T00:00:00.000Z',
          end_time: '2026-12-01T00:00:00.000Z',
        },
      ),
    );

    expect(
      accessControlService.verifyWorkScheduleStaffAccess,
    ).toHaveBeenCalledWith('clerk-1', placeId);
    expect(prisma.workScheduleSlot.findMany).toHaveBeenCalledWith({
      where: {
        staffId,
        actualStartTime: { lt: '2026-12-01T00:00:00.000Z' },
        actualEndTime: { gt: '2026-11-01T00:00:00.000Z' },
      },
      select: {
        id: true,
        slotType: { select: { name: true } },
        actualStartTime: true,
        actualEndTime: true,
      },
      orderBy: [{ actualStartTime: 'asc' }, { actualEndTime: 'asc' }],
    });
    expect(result).toEqual({
      workScheduleSlots: [
        {
          id: 'slot-1',
          slotTypeName: 'เวรเช้า',
          actualStartTime: '2026-10-31T17:00:00.000Z',
          actualEndTime: '2026-11-01T02:00:00.000Z',
        },
      ],
    });
  });

  it('rejects invalid request ranges in the DTO schema', () => {
    expect(
      GetMyWorkScheduleSlotsDtoQuerySchema.safeParse({
        start_time: 'invalid',
        end_time: '2026-11-01T00:00:00.000Z',
      }).success,
    ).toBe(false);
    expect(
      GetMyWorkScheduleSlotsDtoQuerySchema.safeParse({
        start_time: '2026-11-02T00:00:00.000Z',
        end_time: '2026-11-01T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });
});
