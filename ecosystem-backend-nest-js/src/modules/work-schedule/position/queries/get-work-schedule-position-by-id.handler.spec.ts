import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetWorkSchedulePositionByIdHandler } from './get-work-schedule-position-by-id.handler';
import { GetWorkSchedulePositionByIdQuery } from './get-work-schedule-position-by-id.query';

describe('GetWorkSchedulePositionByIdHandler', () => {
  const positionId = '018f6c5e-8557-7888-8123-456789000001';
  const placeId = '018f6c5e-8557-7888-8123-456789000002';
  const query = new GetWorkSchedulePositionByIdQuery('clerk-id', {
    position_id: positionId,
  });
  const findFirst = jest.fn();
  const verify = jest.fn();
  const handler = new GetWorkSchedulePositionByIdHandler(
    { workSchedulePosition: { findFirst } } as unknown as PrismaService,
    {
      verifyWorkSchedulePositionByWorkScheduleAdmin: verify,
    } as unknown as AccessControlService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    verify.mockResolvedValue(undefined);
  });

  it('returns the Place linked to the authorized Position', async () => {
    findFirst.mockResolvedValue({
      name: 'Position',
      organizationWorkSchedulePlaceId: placeId,
    });

    await expect(handler.execute(query)).resolves.toEqual({
      name: 'Position',
      placeId,
    });
    expect(verify).toHaveBeenCalledWith('clerk-id', positionId);
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: positionId, deletedAt: null },
      select: { name: true, organizationWorkSchedulePlaceId: true },
    });
  });

  it('does not read Position data if authorization fails', async () => {
    const error = new Error('forbidden');
    verify.mockRejectedValue(error);

    await expect(handler.execute(query)).rejects.toBe(error);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('preserves the missing Position error', async () => {
    findFirst.mockResolvedValue(null);
    await expect(handler.execute(query)).rejects.toMatchObject({
      status: 404,
    });
  });
});
