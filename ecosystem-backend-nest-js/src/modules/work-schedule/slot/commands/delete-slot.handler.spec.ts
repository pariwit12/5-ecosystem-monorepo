import { HttpStatus } from '@nestjs/common';
import { DeleteSlotHandler } from './delete-slot.handler';
import {
  DeleteSlotCommand,
  DeleteSlotDtoParamSchema,
} from './delete-slot.command';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';

describe('DeleteSlotHandler', () => {
  const clerkId = 'user_clerk_123';
  const positionId = '018f6c5e-8557-7888-8123-456789abcdef';
  const slotId = '018f6c5e-8557-7888-8123-456789000099';

  const mockPrisma = {
    workScheduleSlot: {
      deleteMany: jest.fn(),
    },
  };

  const mockAccessControlService = {
    verifyWorkSchedulePositionByWorkScheduleAdmin: jest.fn(),
  };

  let handler: DeleteSlotHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new DeleteSlotHandler(
      mockPrisma as never,
      mockAccessControlService as never,
    );
  });

  describe('DTO Validation', () => {
    it('accepts valid UUID v7 parameters', () => {
      const result = DeleteSlotDtoParamSchema.safeParse({
        position_id: positionId,
        slot_id: slotId,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid parameters', () => {
      const result = DeleteSlotDtoParamSchema.safeParse({
        position_id: 'bad-id',
        slot_id: slotId,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('execute', () => {
    it('successfully deletes slot when slot exists in position', async () => {
      mockPrisma.workScheduleSlot.deleteMany.mockResolvedValue({ count: 1 });

      await handler.execute(
        new DeleteSlotCommand(clerkId, {
          position_id: positionId,
          slot_id: slotId,
        }),
      );

      expect(
        mockAccessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin,
      ).toHaveBeenCalledWith(clerkId, positionId);
      expect(mockPrisma.workScheduleSlot.deleteMany).toHaveBeenCalledWith({
        where: {
          id: slotId,
          positionId,
        },
      });
    });

    it('throws WORK_SCHEDULE_SLOT_NOT_FOUND when slot does not exist', async () => {
      mockPrisma.workScheduleSlot.deleteMany.mockResolvedValue({ count: 0 });

      await expect(
        handler.execute(
          new DeleteSlotCommand(clerkId, {
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

      expect(mockPrisma.workScheduleSlot.deleteMany).toHaveBeenCalledWith({
        where: {
          id: slotId,
          positionId,
        },
      });
    });

    it('returns the same not-found error for a slot in another position', async () => {
      const otherPositionId = '018f6c5e-8557-7888-8123-456789000088';
      mockPrisma.workScheduleSlot.deleteMany.mockImplementation(
        ({ where }: { where: { id: string; positionId: string } }) =>
          Promise.resolve({
            count:
              where.id === slotId && where.positionId === positionId ? 1 : 0,
          }),
      );

      await expect(
        handler.execute(
          new DeleteSlotCommand(clerkId, {
            position_id: otherPositionId,
            slot_id: slotId,
          }),
        ),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND,
        status: HttpStatus.NOT_FOUND,
      });
      expect(mockPrisma.workScheduleSlot.deleteMany).toHaveBeenCalledWith({
        where: { id: slotId, positionId: otherPositionId },
      });
    });

    it('throws forbidden error when caller is not admin', async () => {
      mockAccessControlService.verifyWorkSchedulePositionByWorkScheduleAdmin.mockRejectedValue(
        new AppException(
          ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
          'Forbidden',
          HttpStatus.FORBIDDEN,
        ),
      );

      await expect(
        handler.execute(
          new DeleteSlotCommand(clerkId, {
            position_id: positionId,
            slot_id: slotId,
          }),
        ),
      ).rejects.toThrow(AppException);

      expect(mockPrisma.workScheduleSlot.deleteMany).not.toHaveBeenCalled();
    });
  });
});
