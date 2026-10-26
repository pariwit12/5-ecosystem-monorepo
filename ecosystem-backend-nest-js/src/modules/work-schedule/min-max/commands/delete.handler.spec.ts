import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { DeleteCommand } from './delete.command';
import { DeleteHandler } from './delete.handler';

describe('DeleteHandler', () => {
  const clerkId = 'user_clerk_123';
  const positionId = '018f6c5e-8557-7888-8123-456789abcdef';
  const minMaxId = '018f6c5e-8557-7888-8123-456789000099';
  const otherPositionId = '018f6c5e-8557-7888-8123-456789000088';
  const prisma = { workScheduleMinMax: { deleteMany: jest.fn() } };
  const accessControl = {
    verifyWorkSchedulePositionByWorkScheduleAdmin: jest.fn(),
  };
  let handler: DeleteHandler;

  const command = (position_id = positionId) =>
    new DeleteCommand(clerkId, { position_id, min_max_id: minMaxId });

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.workScheduleMinMax.deleteMany.mockResolvedValue({ count: 1 });
    handler = new DeleteHandler(prisma as never, accessControl as never);
  });

  it('authorizes and hard-deletes only the requested ID and position', async () => {
    await expect(handler.execute(command())).resolves.toBeUndefined();
    expect(
      accessControl.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ).toHaveBeenCalledWith(clerkId, positionId);
    expect(prisma.workScheduleMinMax.deleteMany).toHaveBeenCalledWith({
      where: { id: minMaxId, workSchedulePositionId: positionId },
    });
    expect(
      accessControl.verifyWorkSchedulePositionByWorkScheduleAdmin.mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      prisma.workScheduleMinMax.deleteMany.mock.invocationCallOrder[0],
    );
  });

  it('returns not-found when the ID does not exist', async () => {
    prisma.workScheduleMinMax.deleteMany.mockResolvedValue({ count: 0 });
    await expect(handler.execute(command())).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND,
      status: HttpStatus.NOT_FOUND,
    });
  });

  it('does not delete a record owned by a different position', async () => {
    const records = [{ id: minMaxId, workSchedulePositionId: positionId }];
    prisma.workScheduleMinMax.deleteMany.mockImplementation(
      ({
        where,
      }: {
        where: { id: string; workSchedulePositionId: string };
      }) => {
        const index = records.findIndex(
          (record) =>
            record.id === where.id &&
            record.workSchedulePositionId === where.workSchedulePositionId,
        );
        if (index < 0) return Promise.resolve({ count: 0 });
        records.splice(index, 1);
        return Promise.resolve({ count: 1 });
      },
    );

    await expect(
      handler.execute(command(otherPositionId)),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND,
      status: HttpStatus.NOT_FOUND,
    });
    expect(records).toEqual([
      { id: minMaxId, workSchedulePositionId: positionId },
    ]);
    expect(prisma.workScheduleMinMax.deleteMany).toHaveBeenCalledWith({
      where: { id: minMaxId, workSchedulePositionId: otherPositionId },
    });
  });

  it('propagates authorization failure without deleting', async () => {
    const error = new AppException(
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
      'Forbidden',
      HttpStatus.FORBIDDEN,
    );
    accessControl.verifyWorkSchedulePositionByWorkScheduleAdmin.mockRejectedValueOnce(
      error,
    );
    await expect(handler.execute(command())).rejects.toBe(error);
    expect(prisma.workScheduleMinMax.deleteMany).not.toHaveBeenCalled();
  });
});
