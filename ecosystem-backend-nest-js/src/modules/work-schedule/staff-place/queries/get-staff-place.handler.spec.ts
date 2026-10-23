import { GetStaffPlaceHandler } from './get-staff-place.handler';
import { GetStaffPlaceQuery } from './get-staff-place.query';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';

describe('GetStaffPlaceHandler', () => {
  const prisma = {
    organizationWorkSchedulePlace: {
      findUnique: jest.fn(),
    },
    workScheduleStaff: {
      findUnique: jest.fn(),
    },
  };

  const accessControlService = {
    verifyWorkScheduleStaffAccess: jest.fn(),
  };

  const handler = new GetStaffPlaceHandler(
    prisma as never,
    accessControlService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns place details and staff profile for authorized staff', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId: 'staff-1',
    });

    prisma.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
      id: '018f6c5e-8557-7888-8123-456789abcdef',
      name: 'Main Clinic',
      timezone: 'Asia/Bangkok',
      deletedAt: null,
    });

    prisma.workScheduleStaff.findUnique.mockResolvedValue({
      id: 'staff-1',
      name: 'Dr. Jane',
      deletedAt: null,
    });

    const result = await handler.execute(
      new GetStaffPlaceQuery('clerk-1', {
        place_id: '018f6c5e-8557-7888-8123-456789abcdef',
      }),
    );

    expect(
      accessControlService.verifyWorkScheduleStaffAccess,
    ).toHaveBeenCalledWith('clerk-1', '018f6c5e-8557-7888-8123-456789abcdef');

    expect(result).toEqual({
      placeId: '018f6c5e-8557-7888-8123-456789abcdef',
      name: 'Main Clinic',
      timezone: 'Asia/Bangkok',
      staff: {
        id: 'staff-1',
        name: 'Dr. Jane',
      },
    });
  });

  it('rejects if place is soft deleted', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId: 'staff-1',
    });

    prisma.organizationWorkSchedulePlace.findUnique.mockResolvedValue({
      id: '018f6c5e-8557-7888-8123-456789abcdef',
      name: 'Main Clinic',
      timezone: 'Asia/Bangkok',
      deletedAt: new Date(),
    });

    await expect(
      handler.execute(
        new GetStaffPlaceQuery('clerk-1', {
          place_id: '018f6c5e-8557-7888-8123-456789abcdef',
        }),
      ),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
    });
  });
});
