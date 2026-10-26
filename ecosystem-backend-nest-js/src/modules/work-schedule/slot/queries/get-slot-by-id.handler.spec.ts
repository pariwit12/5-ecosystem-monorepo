import { HttpStatus } from '@nestjs/common';
import { GetSlotByIdHandler } from './get-slot-by-id.handler';
import {
  GetSlotByIdDtoParamSchema,
  GetSlotByIdQuery,
} from './get-slot-by-id.query';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';

describe('GetSlotByIdHandler', () => {
  const clerkId = 'user_clerk_123';
  const positionId = '018f6c5e-8557-7888-8123-456789abcdef';
  const slotId = '018f6c5e-8557-7888-8123-456789000099';
  const staffId = '018f6c5e-8557-7888-8123-456789000001';
  const slotTypeId = '018f6c5e-8557-7888-8123-456789000003';

  const mockPrisma = {
    workScheduleSlot: {
      findFirst: jest.fn(),
    },
  };

  const mockAccessControlService = {
    verifyWorkSchedulePositionByWorkScheduleAdmin: jest.fn(),
  };

  let handler: GetSlotByIdHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new GetSlotByIdHandler(
      mockPrisma as never,
      mockAccessControlService as never,
    );
  });

  describe('DTO Validation', () => {
    it('accepts valid UUID v7 parameters', () => {
      const result = GetSlotByIdDtoParamSchema.safeParse({
        position_id: positionId,
        slot_id: slotId,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid position_id', () => {
      const result = GetSlotByIdDtoParamSchema.safeParse({
        position_id: 'invalid-uuid',
        slot_id: slotId,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid slot_id', () => {
      const result = GetSlotByIdDtoParamSchema.safeParse({
        position_id: positionId,
        slot_id: 'invalid-uuid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('execute', () => {
    it('returns slot detail when found and belongs to position', async () => {
      const mockSlot = {
        id: slotId,
        staffId,
        staffPosition: {
          workScheduleStaff: {
            name: 'Dr. Jane Doe',
          },
        },
        slotTypeId,
        slotType: {
          name: 'กะเช้า',
        },
        actualStartTime: new Date('2026-10-24T08:00:00.000Z'),
        actualEndTime: new Date('2026-10-24T12:00:00.000Z'),
      };

      mockPrisma.workScheduleSlot.findFirst.mockResolvedValue(mockSlot);

      const result = await handler.execute(
        new GetSlotByIdQuery(clerkId, {
          position_id: positionId,
          slot_id: slotId,
        }),
      );

      expect(
        mockAccessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin,
      ).toHaveBeenCalledWith(clerkId, positionId);

      expect(mockPrisma.workScheduleSlot.findFirst).toHaveBeenCalledWith({
        where: {
          id: slotId,
          positionId,
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

      expect(result).toEqual({
        id: slotId,
        staffId,
        staffName: 'Dr. Jane Doe',
        slotTypeId,
        slotTypeName: 'กะเช้า',
        actualStartTime: '2026-10-24T08:00:00.000Z',
        actualEndTime: '2026-10-24T12:00:00.000Z',
      });
    });

    it('throws WORK_SCHEDULE_SLOT_NOT_FOUND when slot does not exist', async () => {
      mockPrisma.workScheduleSlot.findFirst.mockResolvedValue(null);

      await expect(
        handler.execute(
          new GetSlotByIdQuery(clerkId, {
            position_id: positionId,
            slot_id: slotId,
          }),
        ),
      ).rejects.toThrow(
        new AppException(
          ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND,
          'ไม่พบรายการเวรในระบบ หรือรายการเวรไม่ได้อยู่ในตำแหน่งงานนี้',
          HttpStatus.NOT_FOUND,
        ),
      );
    });

    it('returns the same not-found error for a slot in another position', async () => {
      const otherPositionId = '018f6c5e-8557-7888-8123-456789000088';
      mockPrisma.workScheduleSlot.findFirst.mockImplementation(
        ({ where }: { where: { id: string; positionId: string } }) =>
          Promise.resolve(
            where.id === slotId && where.positionId === positionId
              ? { id: slotId }
              : null,
          ),
      );

      await expect(
        handler.execute(
          new GetSlotByIdQuery(clerkId, {
            position_id: otherPositionId,
            slot_id: slotId,
          }),
        ),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND,
        status: HttpStatus.NOT_FOUND,
      });
      expect(mockPrisma.workScheduleSlot.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: slotId, positionId: otherPositionId },
        }),
      );
    });

    it('propagates error when access control fails', async () => {
      mockAccessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin.mockRejectedValue(
        new AppException(
          ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
          'Forbidden',
          HttpStatus.FORBIDDEN,
        ),
      );

      await expect(
        handler.execute(
          new GetSlotByIdQuery(clerkId, {
            position_id: positionId,
            slot_id: slotId,
          }),
        ),
      ).rejects.toThrow(AppException);

      expect(mockPrisma.workScheduleSlot.findFirst).not.toHaveBeenCalled();
    });
  });
});
