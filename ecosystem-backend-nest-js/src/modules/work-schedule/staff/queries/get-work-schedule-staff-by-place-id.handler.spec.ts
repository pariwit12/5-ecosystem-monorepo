import { GetWorkScheduleStaffByPlaceIdHandler } from './get-work-schedule-staff-by-place-id.handler';
import { GetWorkScheduleStaffByPlaceIdQuery } from './get-work-schedule-staff-by-place-id.query';

describe('GetWorkScheduleStaffByPlaceIdHandler', () => {
  const prisma = {
    workScheduleStaff: {
      findMany: jest.fn(),
    },
  };

  const accessControlService = {
    verifyWorkScheduleAdminAccess: jest.fn(),
  };

  const handler = new GetWorkScheduleStaffByPlaceIdHandler(
    prisma as never,
    accessControlService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies admin access and maps isLinked correctly based on personId', async () => {
    accessControlService.verifyWorkScheduleAdminAccess.mockResolvedValue({
      personId: 'admin-person-id',
    });

    prisma.workScheduleStaff.findMany.mockResolvedValue([
      { id: 'staff-1', name: 'Alice', personId: 'person-1' },
      { id: 'staff-2', name: 'Bob', personId: null },
    ]);

    const result = await handler.execute(
      new GetWorkScheduleStaffByPlaceIdQuery('clerk-1', {
        place_id: '018f6c5e-8557-7888-8123-456789abcdef',
      }),
    );

    expect(
      accessControlService.verifyWorkScheduleAdminAccess,
    ).toHaveBeenCalledWith('clerk-1', '018f6c5e-8557-7888-8123-456789abcdef');

    expect(prisma.workScheduleStaff.findMany).toHaveBeenCalledWith({
      where: {
        organizationWorkSchedulePlaceId: '018f6c5e-8557-7888-8123-456789abcdef',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        personId: true,
      },
    });

    expect(result).toEqual({
      workScheduleStaffs: [
        { id: 'staff-1', name: 'Alice', isLinked: true },
        { id: 'staff-2', name: 'Bob', isLinked: false },
      ],
    });
  });
});
