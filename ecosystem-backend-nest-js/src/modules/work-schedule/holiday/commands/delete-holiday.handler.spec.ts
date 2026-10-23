import { DeleteHolidayHandler } from './delete-holiday.handler';
import { DeleteHolidayCommand } from './delete-holiday.command';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { AppException } from '../../../../common/exceptions/app.exception';

describe('DeleteHolidayHandler', () => {
  const prisma = {
    workScheduleHoliday: {
      deleteMany: jest.fn(),
    },
  };

  const accessControlService = {
    verifyWorkScheduleStaffAccess: jest.fn(),
  };

  let handler: DeleteHolidayHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new DeleteHolidayHandler(
      prisma as never,
      accessControlService as never,
    );
  });

  const validPlaceId = '018f6c5e-8557-7888-8123-456789abcdef';
  const validHolidayId = '018f6c5e-8557-7888-8123-456789111111';
  const staffId = '018f6c5e-8557-7888-8123-456789000001';

  it('successfully deletes holiday owned by the current staff', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId,
    });

    prisma.workScheduleHoliday.deleteMany.mockResolvedValue({
      count: 1,
    });

    await expect(
      handler.execute(
        new DeleteHolidayCommand('clerk-1', {
          place_id: validPlaceId,
          holiday_id: validHolidayId,
        }),
      ),
    ).resolves.toBeUndefined();

    expect(prisma.workScheduleHoliday.deleteMany).toHaveBeenCalledWith({
      where: {
        id: validHolidayId,
        workScheduleStaffId: staffId,
      },
    });
  });

  it('throws 404 WORK_SCHEDULE_HOLIDAY_NOT_FOUND when record not found or belongs to another staff', async () => {
    accessControlService.verifyWorkScheduleStaffAccess.mockResolvedValue({
      personId: 'person-1',
      staffId,
    });

    prisma.workScheduleHoliday.deleteMany.mockResolvedValue({
      count: 0,
    });

    await expect(
      handler.execute(
        new DeleteHolidayCommand('clerk-1', {
          place_id: validPlaceId,
          holiday_id: validHolidayId,
        }),
      ),
    ).rejects.toThrow(
      new AppException(
        ErrorCode.WORK_SCHEDULE_HOLIDAY_NOT_FOUND,
        'ไม่พบข้อมูลวันหยุดที่ต้องการ หรือคุณไม่มีสิทธิ์เข้าถึงรายการนี้',
        404,
      ),
    );
  });
});
