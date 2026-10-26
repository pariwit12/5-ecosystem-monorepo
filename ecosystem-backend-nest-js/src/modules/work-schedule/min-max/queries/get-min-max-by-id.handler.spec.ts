import { HttpStatus } from '@nestjs/common';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { GetMinMaxByIdQuery } from './get-min-max-by-id.query';
import { GetMinMaxByIdHandler } from './get-min-max-by-id.handler';

describe('GetMinMaxByIdHandler', () => {
  const clerkId = 'user_clerk_123';
  const positionId = '018f6c5e-8557-7888-8123-456789abcdef';
  const minMaxId = '018f6c5e-8557-7888-8123-456789000099';
  const otherPositionId = '018f6c5e-8557-7888-8123-456789000088';
  const minMax = {
    id: minMaxId,
    min: null,
    max: 3,
    startTime: new Date('2026-10-24T15:00:00+07:00'),
    endTime: new Date('2026-10-24T19:00:00+07:00'),
  };
  const prisma = { workScheduleMinMax: { findFirst: jest.fn() } };
  const accessControl = {
    verifyWorkSchedulePositionByWorkScheduleAdmin: jest.fn(),
  };
  let handler: GetMinMaxByIdHandler;

  const query = (position_id = positionId) =>
    new GetMinMaxByIdQuery(clerkId, { position_id, min_max_id: minMaxId });

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.workScheduleMinMax.findFirst.mockResolvedValue(minMax);
    handler = new GetMinMaxByIdHandler(prisma as never, accessControl as never);
  });

  it('authorizes and returns scoped detail with nullable bounds and ISO times', async () => {
    await expect(handler.execute(query())).resolves.toEqual({
      id: minMaxId,
      min: null,
      max: 3,
      startTime: '2026-10-24T08:00:00.000Z',
      endTime: '2026-10-24T12:00:00.000Z',
    });
    expect(
      accessControl.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ).toHaveBeenCalledWith(clerkId, positionId);
    expect(prisma.workScheduleMinMax.findFirst).toHaveBeenCalledWith({
      where: { id: minMaxId, workSchedulePositionId: positionId },
      select: {
        id: true,
        min: true,
        max: true,
        startTime: true,
        endTime: true,
      },
    });
    expect(
      accessControl.verifyWorkSchedulePositionByWorkScheduleAdmin.mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      prisma.workScheduleMinMax.findFirst.mock.invocationCallOrder[0],
    );
  });

  it('returns not-found for a missing ID', async () => {
    prisma.workScheduleMinMax.findFirst.mockResolvedValue(null);
    await expect(handler.execute(query())).rejects.toMatchObject({
      errorCode: ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND,
      status: HttpStatus.NOT_FOUND,
    });
  });

  it('returns not-found for an ID belonging to another position', async () => {
    prisma.workScheduleMinMax.findFirst.mockImplementation(
      ({ where }: { where: { id: string; workSchedulePositionId: string } }) =>
        Promise.resolve(
          where.id === minMaxId && where.workSchedulePositionId === positionId
            ? minMax
            : null,
        ),
    );

    await expect(handler.execute(query(otherPositionId))).rejects.toMatchObject(
      {
        errorCode: ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND,
        status: HttpStatus.NOT_FOUND,
      },
    );
    expect(prisma.workScheduleMinMax.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: minMaxId, workSchedulePositionId: otherPositionId },
      }),
    );
  });

  it('propagates authorization failure without reading the item', async () => {
    const error = new AppException(
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
      'Forbidden',
      HttpStatus.FORBIDDEN,
    );
    accessControl.verifyWorkSchedulePositionByWorkScheduleAdmin.mockRejectedValueOnce(
      error,
    );

    await expect(handler.execute(query())).rejects.toBe(error);
    expect(prisma.workScheduleMinMax.findFirst).not.toHaveBeenCalled();
  });
});
