import { GetSlotsByPositionIdStartTimeEndTimeHandler } from './get-slots-by-position-id-start-time-end-time.handler';
import { GetSlotsByPositionIdStartTimeEndTimeQuery } from './get-slots-by-position-id-start-time-end-time.query';

describe('GetSlotsByPositionIdStartTimeEndTimeHandler', () => {
  const positionId = '018f6c5e-8557-7888-8123-456789abcdef';
  const startTime = new Date('2026-10-24T01:00:00.000Z');
  const endTime = new Date('2026-10-25T01:00:00.000Z');
  const prisma = {
    workScheduleSlot: { findMany: jest.fn() },
    workScheduleMinMax: { findMany: jest.fn() },
    workScheduleHoliday: { findMany: jest.fn() },
  };
  const accessControlService = {
    verifyWorkSchedulePositionByWorkScheduleAdmin: jest.fn(),
  };
  let handler: GetSlotsByPositionIdStartTimeEndTimeHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.workScheduleSlot.findMany.mockResolvedValue([
      {
        id: 'slot-1',
        staffId: 'staff-1',
        staffPosition: { workScheduleStaff: { name: 'Staff One' } },
        slotTypeId: 'slot-type-1',
        slotType: { name: 'Day' },
        actualStartTime: startTime,
        actualEndTime: endTime,
      },
    ]);
    prisma.workScheduleMinMax.findMany.mockResolvedValue([
      {
        id: 'min-max-1',
        min: 1,
        max: 2,
        startTime,
        endTime,
      },
    ]);
    prisma.workScheduleHoliday.findMany.mockResolvedValue([
      {
        id: 'holiday-1',
        workScheduleStaffId: 'staff-1',
        startTime,
        endTime,
      },
    ]);
    handler = new GetSlotsByPositionIdStartTimeEndTimeHandler(
      prisma as never,
      accessControlService as never,
    );
  });

  it('returns overlapping holidays for active staff linked to the position with the existing slots and min-max data', async () => {
    const result = await handler.execute(
      new GetSlotsByPositionIdStartTimeEndTimeQuery(
        'clerk-1',
        { position_id: positionId },
        {
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        },
      ),
    );

    expect(
      accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ).toHaveBeenCalledWith('clerk-1', positionId);
    expect(prisma.workScheduleHoliday.findMany).toHaveBeenCalledWith({
      where: {
        startTime: { lt: endTime.toISOString() },
        endTime: { gt: startTime.toISOString() },
        workScheduleStaff: {
          deletedAt: null,
          workScheduleStaffPositions: {
            some: { workSchedulePositionId: positionId, deletedAt: null },
          },
        },
      },
      select: {
        id: true,
        workScheduleStaffId: true,
        startTime: true,
        endTime: true,
      },
      orderBy: [{ startTime: 'asc' }, { endTime: 'asc' }, { id: 'asc' }],
    });
    expect(result).toEqual({
      workScheduleSlots: [
        {
          id: 'slot-1',
          staffId: 'staff-1',
          staffName: 'Staff One',
          slotTypeId: 'slot-type-1',
          slotTypeName: 'Day',
          actualStartTime: startTime.toISOString(),
          actualEndTime: endTime.toISOString(),
        },
      ],
      minMaxs: [
        {
          id: 'min-max-1',
          min: 1,
          max: 2,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      ],
      workScheduleHolidays: [
        {
          id: 'holiday-1',
          staffId: 'staff-1',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      ],
    });
  });
});
