import { BadRequestException, HttpStatus } from '@nestjs/common';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { UpdateCommand, UpdateDtoBody } from './update.command';
import { UpdateHandler } from './update.handler';

describe('UpdateHandler', () => {
  const clerkId = 'user_clerk_123';
  const positionId = '018f6c5e-8557-7888-8123-456789abcdef';
  const minMaxId = '018f6c5e-8557-7888-8123-456789000099';
  const otherPositionId = '018f6c5e-8557-7888-8123-456789000088';
  const body: UpdateDtoBody = {
    min: 1,
    max: 3,
    start_time: '2026-10-24T08:00:00.000Z',
    end_time: '2026-10-24T12:00:00.000Z',
  };
  const tx = {
    $queryRaw: jest.fn(),
    workScheduleMinMax: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const prisma = { $transaction: jest.fn() };
  const accessControl = {
    verifyWorkSchedulePositionByWorkScheduleAdmin: jest.fn(),
  };
  let handler: UpdateHandler;

  const command = (
    values: Partial<UpdateDtoBody> = {},
    position_id = positionId,
  ) =>
    new UpdateCommand(
      clerkId,
      { position_id, min_max_id: minMaxId },
      { ...body, ...values },
    );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      (operation: (client: unknown) => Promise<void>) => operation(tx),
    );
    tx.workScheduleMinMax.findFirst
      .mockResolvedValueOnce({ id: minMaxId })
      .mockResolvedValue(null);
    tx.workScheduleMinMax.update.mockResolvedValue({ id: minMaxId });
    handler = new UpdateHandler(prisma as never, accessControl as never);
  });

  it('authorizes, locks the position, scopes both reads and writes, and replaces all fields', async () => {
    await expect(handler.execute(command())).resolves.toBeUndefined();

    expect(
      accessControl.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ).toHaveBeenCalledWith(clerkId, positionId);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    const lockCalls = tx.$queryRaw.mock.calls as Array<[string[], string]>;
    expect(lockCalls).toHaveLength(1);
    expect(lockCalls[0][0].join('?')).toBe(
      'SELECT id FROM "work_schedule_position" WHERE id = ? FOR UPDATE',
    );
    expect(lockCalls[0][1]).toBe(positionId);
    expect(tx.workScheduleMinMax.findFirst).toHaveBeenNthCalledWith(1, {
      where: { id: minMaxId, workSchedulePositionId: positionId },
      select: { id: true },
    });
    expect(tx.workScheduleMinMax.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        id: { not: minMaxId },
        workSchedulePositionId: positionId,
        startTime: { lt: body.end_time },
        endTime: { gt: body.start_time },
      },
      select: { startTime: true, endTime: true },
    });
    expect(tx.workScheduleMinMax.update).toHaveBeenCalledWith({
      where: { id: minMaxId, workSchedulePositionId: positionId },
      data: {
        min: 1,
        max: 3,
        startTime: body.start_time,
        endTime: body.end_time,
      },
      select: { id: true },
    });
    expect(
      accessControl.verifyWorkSchedulePositionByWorkScheduleAdmin.mock
        .invocationCallOrder[0],
    ).toBeLessThan(prisma.$transaction.mock.invocationCallOrder[0]);
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.workScheduleMinMax.findFirst.mock.invocationCallOrder[0],
    );
    expect(
      tx.workScheduleMinMax.findFirst.mock.invocationCallOrder[1],
    ).toBeLessThan(tx.workScheduleMinMax.update.mock.invocationCallOrder[0]);
  });

  it.each([{ min: null }, { max: null }])(
    'writes explicit null to clear an existing bound: %j',
    async (values) => {
      await handler.execute(command(values));
      expect(tx.workScheduleMinMax.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            min: body.min,
            max: body.max,
            ...values,
            startTime: body.start_time,
            endTime: body.end_time,
          },
        }),
      );
    },
  );

  it('rejects an overlapping interval without updating', async () => {
    tx.workScheduleMinMax.findFirst.mockReset();
    tx.workScheduleMinMax.findFirst
      .mockResolvedValueOnce({ id: minMaxId })
      .mockResolvedValueOnce({
        startTime: new Date('2026-10-24T09:00:00Z'),
        endTime: new Date('2026-10-24T11:00:00Z'),
      });

    await expect(handler.execute(command())).rejects.toThrow(
      BadRequestException,
    );
    expect(tx.workScheduleMinMax.update).not.toHaveBeenCalled();
  });

  it('allows both touching boundaries, excludes itself and ignores other positions', async () => {
    const records = [
      {
        id: minMaxId,
        workSchedulePositionId: positionId,
        startTime: new Date(body.start_time),
        endTime: new Date(body.end_time),
      },
      {
        id: 'before',
        workSchedulePositionId: positionId,
        startTime: new Date('2026-10-24T06:00:00Z'),
        endTime: new Date(body.start_time),
      },
      {
        id: 'after',
        workSchedulePositionId: positionId,
        startTime: new Date(body.end_time),
        endTime: new Date('2026-10-24T14:00:00Z'),
      },
      {
        id: 'another-position',
        workSchedulePositionId: otherPositionId,
        startTime: new Date(body.start_time),
        endTime: new Date(body.end_time),
      },
    ];
    tx.workScheduleMinMax.findFirst.mockReset();
    tx.workScheduleMinMax.findFirst.mockImplementation(
      ({
        where,
      }: {
        where: {
          id: string | { not: string };
          workSchedulePositionId: string;
          startTime?: { lt: string };
          endTime?: { gt: string };
        };
      }) => {
        const { id, startTime, endTime } = where;
        return Promise.resolve(
          records.find(
            (record) =>
              record.workSchedulePositionId === where.workSchedulePositionId &&
              (typeof id === 'string'
                ? record.id === id
                : record.id !== id.not &&
                  record.startTime < new Date(startTime!.lt) &&
                  record.endTime > new Date(endTime!.gt)),
          ) ?? null,
        );
      },
    );

    await expect(handler.execute(command())).resolves.toBeUndefined();
    expect(tx.workScheduleMinMax.update).toHaveBeenCalledTimes(1);
  });

  it.each([positionId, otherPositionId])(
    'returns not-found for a missing or differently scoped item in position %s',
    async (position_id) => {
      tx.workScheduleMinMax.findFirst.mockReset();
      tx.workScheduleMinMax.findFirst.mockResolvedValue(null);

      await expect(
        handler.execute(command({}, position_id)),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND,
        status: HttpStatus.NOT_FOUND,
      });
      expect(tx.workScheduleMinMax.findFirst).toHaveBeenCalledTimes(1);
      expect(tx.workScheduleMinMax.findFirst).toHaveBeenCalledWith({
        where: { id: minMaxId, workSchedulePositionId: position_id },
        select: { id: true },
      });
      expect(tx.workScheduleMinMax.update).not.toHaveBeenCalled();
    },
  );

  it('does not start a transaction when authorization fails', async () => {
    const error = new AppException(
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
      'Forbidden',
      HttpStatus.FORBIDDEN,
    );
    accessControl.verifyWorkSchedulePositionByWorkScheduleAdmin.mockRejectedValueOnce(
      error,
    );

    await expect(handler.execute(command())).rejects.toBe(error);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.workScheduleMinMax.update).not.toHaveBeenCalled();
  });
});
