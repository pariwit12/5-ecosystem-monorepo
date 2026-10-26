import { BadRequestException, HttpStatus } from '@nestjs/common';
import { UpdateSlotHandler } from './update-slot.handler';
import {
  UpdateSlotCommand,
  UpdateSlotDtoBodySchema,
  UpdateSlotDtoParamSchema,
} from './update-slot.command';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';

describe('UpdateSlotHandler', () => {
  const clerkId = 'user_clerk_123';
  const positionId = '018f6c5e-8557-7888-8123-456789abcdef';
  const slotId = '018f6c5e-8557-7888-8123-456789000099';
  const staffId = '018f6c5e-8557-7888-8123-456789000001';
  const slotTypeId = '018f6c5e-8557-7888-8123-456789000003';
  const startTime = '2026-10-24T08:00:00.000Z';
  const endTime = '2026-10-24T12:00:00.000Z';

  const tx = {
    $queryRaw: jest.fn(),
    workScheduleSlot: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    workScheduleStaffPosition: {
      findFirst: jest.fn(),
    },
    workScheduleSlotType: {
      findFirst: jest.fn(),
    },
    workScheduleHoliday: {
      findMany: jest.fn(),
    },
    workScheduleMinMax: {
      findMany: jest.fn(),
    },
  };

  const prisma = {
    $transaction: jest.fn(),
  };

  const accessControlService = {
    verifyWorkSchedulePositionByWorkScheduleAdmin: jest.fn(),
  };

  let handler: UpdateSlotHandler;

  function createCommand(
    overrides?: Partial<{
      position_id: string;
      slot_id: string;
      staff_id: string;
      slot_type_id: string;
      actual_start_time: string;
      actual_end_time: string;
    }>,
  ) {
    return new UpdateSlotCommand(
      clerkId,
      {
        position_id: overrides?.position_id ?? positionId,
        slot_id: overrides?.slot_id ?? slotId,
      },
      {
        staff_id: overrides?.staff_id ?? staffId,
        slot_type_id: overrides?.slot_type_id ?? slotTypeId,
        actual_start_time: overrides?.actual_start_time ?? startTime,
        actual_end_time: overrides?.actual_end_time ?? endTime,
      },
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.$transaction.mockImplementation(
      (operation: (client: unknown) => Promise<unknown>) => operation(tx),
    );

    tx.workScheduleStaffPosition.findFirst.mockResolvedValue({
      workScheduleStaffId: staffId,
    });
    tx.workScheduleSlotType.findFirst.mockResolvedValue({
      id: slotTypeId,
    });

    tx.$queryRaw.mockResolvedValue([]);
    tx.workScheduleSlot.findFirst.mockResolvedValue({ id: slotId });
    tx.workScheduleSlot.findMany.mockResolvedValue([]);
    tx.workScheduleHoliday.findMany.mockResolvedValue([]);
    tx.workScheduleMinMax.findMany.mockResolvedValue([]);
    tx.workScheduleSlot.update.mockResolvedValue({
      id: slotId,
      staffId,
      staffPosition: {
        workScheduleStaff: { name: 'Dr. Jane' },
      },
      slotTypeId,
      slotType: { name: 'Morning' },
      actualStartTime: new Date(startTime),
      actualEndTime: new Date(endTime),
    });

    handler = new UpdateSlotHandler(
      prisma as never,
      accessControlService as never,
    );
  });

  describe('DTO Validation', () => {
    it('accepts valid param and body', () => {
      const paramResult = UpdateSlotDtoParamSchema.safeParse({
        position_id: positionId,
        slot_id: slotId,
      });
      expect(paramResult.success).toBe(true);

      const bodyResult = UpdateSlotDtoBodySchema.safeParse({
        staff_id: staffId,
        slot_type_id: slotTypeId,
        actual_start_time: startTime,
        actual_end_time: endTime,
      });
      expect(bodyResult.success).toBe(true);
    });

    it('rejects actual_end_time <= actual_start_time', () => {
      const bodyResult = UpdateSlotDtoBodySchema.safeParse({
        staff_id: staffId,
        slot_type_id: slotTypeId,
        actual_start_time: endTime,
        actual_end_time: startTime,
      });
      expect(bodyResult.success).toBe(false);
    });

    it('rejects invalid UUIDs', () => {
      const paramResult = UpdateSlotDtoParamSchema.safeParse({
        position_id: 'bad-uuid',
        slot_id: slotId,
      });
      expect(paramResult.success).toBe(false);
    });

    it('requires an explicit offset on datetime values', () => {
      const result = UpdateSlotDtoBodySchema.safeParse({
        staff_id: staffId,
        slot_type_id: slotTypeId,
        actual_start_time: '2026-10-24T08:00:00',
        actual_end_time: endTime,
      });

      expect(result.success).toBe(false);
    });

    it('accepts an offset while comparing the actual instants', () => {
      const result = UpdateSlotDtoBodySchema.safeParse({
        staff_id: staffId,
        slot_type_id: slotTypeId,
        actual_start_time: '2026-10-24T15:00:00+07:00',
        actual_end_time: '2026-10-24T09:00:00Z',
      });

      expect(result.success).toBe(true);
    });

    it('rejects equal start and end times with different offsets', () => {
      const result = UpdateSlotDtoBodySchema.safeParse({
        staff_id: staffId,
        slot_type_id: slotTypeId,
        actual_start_time: '2026-10-24T15:00:00+07:00',
        actual_end_time: '2026-10-24T08:00:00Z',
      });

      expect(result.success).toBe(false);
    });

    it('rejects UUID v4 and missing required body fields', () => {
      expect(
        UpdateSlotDtoParamSchema.safeParse({
          position_id: positionId,
          slot_id: '018f6c5e-8557-4888-8123-456789000099',
        }).success,
      ).toBe(false);
      expect(
        UpdateSlotDtoBodySchema.safeParse({
          staff_id: staffId,
          actual_start_time: startTime,
          actual_end_time: endTime,
        }).success,
      ).toBe(false);
    });
  });

  describe('execute', () => {
    it('successfully updates slot and returns mapped response', async () => {
      const res = await handler.execute(createCommand());

      expect(
        accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin,
      ).toHaveBeenCalledWith(clerkId, positionId);
      expect(tx.$queryRaw).toHaveBeenCalled();
      expect(tx.workScheduleSlot.update).toHaveBeenCalledWith({
        where: {
          id: slotId,
          positionId,
        },
        data: {
          staffId,
          slotTypeId,
          actualStartTime: startTime,
          actualEndTime: endTime,
        },
        select: {
          id: true,
          staffId: true,
          staffPosition: {
            select: {
              workScheduleStaff: {
                select: {
                  name: true,
                },
              },
            },
          },
          slotTypeId: true,
          slotType: {
            select: {
              name: true,
            },
          },
          actualStartTime: true,
          actualEndTime: true,
        },
      });
      expect(res).toEqual({
        id: slotId,
        staffId,
        staffName: 'Dr. Jane',
        slotTypeId,
        slotTypeName: 'Morning',
        actualStartTime: startTime,
        actualEndTime: endTime,
      });
    });

    it('throws WORK_SCHEDULE_SLOT_NOT_FOUND when slot does not exist', async () => {
      tx.workScheduleSlot.findFirst.mockResolvedValue(null);

      await expect(handler.execute(createCommand())).rejects.toThrow(
        new AppException(
          ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND,
          'ไม่พบรายการเวรในระบบ หรือรายการเวรไม่ได้อยู่ในตำแหน่งงานนี้',
          HttpStatus.NOT_FOUND,
        ),
      );
      expect(tx.workScheduleStaffPosition.findFirst).not.toHaveBeenCalled();
      expect(tx.workScheduleSlotType.findFirst).not.toHaveBeenCalled();
    });

    it('does not start a transaction when caller is not a position admin', async () => {
      accessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin.mockRejectedValueOnce(
        new AppException(
          ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
          'Forbidden',
          HttpStatus.FORBIDDEN,
        ),
      );

      await expect(handler.execute(createCommand())).rejects.toThrow(
        AppException,
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does not update a slot from another position', async () => {
      const otherPositionId = '018f6c5e-8557-7888-8123-456789000088';
      tx.workScheduleSlot.findFirst.mockImplementation(
        ({ where }: { where: { id: string; positionId: string } }) =>
          Promise.resolve(
            where.id === slotId && where.positionId === positionId
              ? { id: slotId }
              : null,
          ),
      );

      await expect(
        handler.execute(createCommand({ position_id: otherPositionId })),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND,
        status: HttpStatus.NOT_FOUND,
      });
      expect(tx.workScheduleSlot.findFirst).toHaveBeenCalledWith({
        where: { id: slotId, positionId: otherPositionId },
        select: { id: true },
      });
      expect(tx.workScheduleSlot.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when staff is not registered in position', async () => {
      tx.workScheduleStaffPosition.findFirst.mockResolvedValue(null);

      await expect(handler.execute(createCommand())).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.workScheduleStaffPosition.findFirst).toHaveBeenCalledWith({
        where: {
          workSchedulePositionId: positionId,
          workScheduleStaffId: staffId,
          deletedAt: null,
        },
        select: { workScheduleStaffId: true },
      });
    });

    it('throws BadRequestException when slot type does not exist or is deleted', async () => {
      tx.workScheduleSlotType.findFirst.mockResolvedValue(null);

      await expect(handler.execute(createCommand())).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(tx.workScheduleSlotType.findFirst).toHaveBeenCalledWith({
        where: { id: slotTypeId, positionId, deletedAt: null },
        select: { id: true },
      });
    });

    it('excludes slot itself from conflict query', async () => {
      await handler.execute(createCommand());

      const lastCall = tx.workScheduleSlot.findMany.mock.calls[0] as [
        { where: { id: { not: string } } },
      ];
      expect(lastCall[0].where.id).toEqual({ not: slotId });
    });

    it('throws BadRequestException when staff has overlapping slot', async () => {
      tx.workScheduleSlot.findMany.mockResolvedValue([
        {
          id: '018f6c5e-8557-7888-8123-456789999999',
          positionId,
          staffId,
          slotType: { id: slotTypeId, name: 'กะอื่น' },
          actualStartTime: new Date('2026-10-24T09:00:00.000Z'),
          actualEndTime: new Date('2026-10-24T11:00:00.000Z'),
        },
      ]);

      await expect(handler.execute(createCommand())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows touching boundary slots (half-open interval)', async () => {
      // Slot ends exactly when new slot starts
      tx.workScheduleSlot.findMany.mockResolvedValue([
        {
          id: '018f6c5e-8557-7888-8123-456789999999',
          positionId,
          staffId,
          slotType: { id: slotTypeId, name: 'กะอื่น' },
          actualStartTime: new Date('2026-10-24T06:00:00.000Z'),
          actualEndTime: new Date('2026-10-24T08:00:00.000Z'),
        },
      ]);

      await expect(handler.execute(createCommand())).resolves.toBeDefined();
    });

    it('throws WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP when overlapping with staff holiday', async () => {
      tx.workScheduleHoliday.findMany.mockResolvedValue([
        {
          workScheduleStaffId: staffId,
          startTime: new Date('2026-10-24T10:00:00.000Z'),
          endTime: new Date('2026-10-24T14:00:00.000Z'),
        },
      ]);

      await expect(handler.execute(createCommand())).rejects.toMatchObject({
        errorCode: ErrorCode.WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP,
        status: HttpStatus.CONFLICT,
      });
    });

    it('allows holidays that touch either boundary of the updated slot', async () => {
      tx.workScheduleHoliday.findMany.mockResolvedValue([
        {
          workScheduleStaffId: staffId,
          startTime: new Date('2026-10-24T06:00:00.000Z'),
          endTime: new Date(startTime),
        },
        {
          workScheduleStaffId: staffId,
          startTime: new Date(endTime),
          endTime: new Date('2026-10-24T14:00:00.000Z'),
        },
      ]);

      await expect(handler.execute(createCommand())).resolves.toBeDefined();
      expect(tx.workScheduleHoliday.findMany).toHaveBeenCalledWith({
        where: {
          workScheduleStaffId: staffId,
          startTime: { lt: new Date(endTime) },
          endTime: { gt: new Date(startTime) },
        },
        select: {
          workScheduleStaffId: true,
          startTime: true,
          endTime: true,
        },
      });
    });

    it('counts the updated slot only once when position max is one', async () => {
      tx.workScheduleMinMax.findMany.mockResolvedValue([
        {
          max: 1,
          startTime: new Date('2026-10-24T00:00:00.000Z'),
          endTime: new Date('2026-10-25T00:00:00.000Z'),
        },
      ]);
      tx.workScheduleSlot.findMany.mockImplementation(
        ({ where }: { where: { id?: { not: string } } }) =>
          Promise.resolve(
            where.id?.not === slotId
              ? []
              : [
                  {
                    id: slotId,
                    positionId,
                    staffId,
                    slotType: { id: slotTypeId, name: 'Morning' },
                    actualStartTime: new Date(startTime),
                    actualEndTime: new Date(endTime),
                  },
                ],
          ),
      );

      await expect(handler.execute(createCommand())).resolves.toBeDefined();
      expect(tx.workScheduleSlot.update).toHaveBeenCalledTimes(1);
    });

    it('throws BadRequestException when position max staff is exceeded', async () => {
      tx.workScheduleMinMax.findMany.mockResolvedValue([
        {
          max: 1,
          startTime: new Date('2026-10-24T00:00:00.000Z'),
          endTime: new Date('2026-10-25T00:00:00.000Z'),
        },
      ]);

      // There is already 1 other slot in this position at the same time
      tx.workScheduleSlot.findMany.mockResolvedValue([
        {
          id: '018f6c5e-8557-7888-8123-456789999999',
          positionId,
          staffId: '018f6c5e-8557-7888-8123-456789000002',
          slotType: { id: slotTypeId, name: 'กะอื่น' },
          actualStartTime: new Date('2026-10-24T08:00:00.000Z'),
          actualEndTime: new Date('2026-10-24T12:00:00.000Z'),
        },
      ]);

      // Adding our updated slot makes concurrent staff = 2, exceeding max: 1
      await expect(handler.execute(createCommand())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('retries on P2034 serialization failure', async () => {
      let callCount = 0;
      prisma.$transaction.mockImplementation(
        async (operation: (client: unknown) => Promise<unknown>) => {
          callCount++;
          if (callCount === 1) {
            const err = new Error('Serialization failure');
            (err as { code?: string }).code = 'P2034';
            throw err;
          }
          return operation(tx);
        },
      );

      await expect(handler.execute(createCommand())).resolves.toBeDefined();
      expect(callCount).toBe(2);
    });

    it('locks the position in every Serializable transaction attempt', async () => {
      tx.workScheduleSlot.update.mockRejectedValueOnce({ code: 'P2034' });

      await expect(handler.execute(createCommand())).resolves.toBeDefined();

      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      for (const call of prisma.$transaction.mock.calls as Array<
        [unknown, { isolationLevel: string }]
      >) {
        expect(call[1]).toEqual({ isolationLevel: 'Serializable' });
      }
      expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
      for (const call of tx.$queryRaw.mock.calls as Array<[string[], string]>) {
        expect(call[0].join('?')).toBe(
          'SELECT id FROM "work_schedule_position" WHERE id = ? FOR UPDATE',
        );
        expect(call[1]).toBe(positionId);
      }
    });

    it('returns conflict after exhausting serialization retries', async () => {
      prisma.$transaction.mockRejectedValue({ code: 'P2034' });

      await expect(handler.execute(createCommand())).rejects.toMatchObject({
        errorCode: ErrorCode.DEFAULT_ERROR,
        status: HttpStatus.CONFLICT,
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(4);
      expect(tx.workScheduleSlot.update).not.toHaveBeenCalled();
    });

    it('does NOT retry on AppException or BadRequestException', async () => {
      let callCount = 0;
      prisma.$transaction.mockImplementation(
        async (operation: (client: unknown) => Promise<unknown>) => {
          callCount++;
          return operation(tx);
        },
      );

      tx.workScheduleSlot.findFirst.mockResolvedValue(null);

      await expect(handler.execute(createCommand())).rejects.toThrow(
        AppException,
      );
      expect(callCount).toBe(1);
    });
  });
});
