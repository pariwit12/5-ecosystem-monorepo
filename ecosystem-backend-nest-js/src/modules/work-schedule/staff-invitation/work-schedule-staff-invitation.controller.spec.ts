import { Test, TestingModule } from '@nestjs/testing';
import { WorkScheduleStaffInvitationController } from './work-schedule-staff-invitation.controller';
import { WorkScheduleStaffInvitationService } from './work-schedule-staff-invitation.service';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';

describe('WorkScheduleStaffInvitationController', () => {
  let controller: WorkScheduleStaffInvitationController;

  const service = {
    issue: jest.fn(),
    preview: jest.fn(),
    submit: jest.fn(),
    listMine: jest.fn(),
    listByPlace: jest.fn(),
    decide: jest.fn(),
    unlink: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkScheduleStaffInvitationController],
      providers: [
        {
          provide: WorkScheduleStaffInvitationService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WorkScheduleStaffInvitationController>(
      WorkScheduleStaffInvitationController,
    );
  });

  it('delegates issue to service with correct parameters', async () => {
    service.issue.mockResolvedValue({
      invitationId: 'inv-1',
      code: 'code-123456789012345678',
      expiresAt: '2026-10-30T00:00:00.000Z',
    });

    const res = await controller.issue('clerk-1', {
      place_id: '018f6c5e-8557-7888-8123-456789abcdef',
      staff_id: '018f6c5e-8557-7888-8123-456789abcdee',
    });

    expect(service.issue).toHaveBeenCalledWith(
      'clerk-1',
      '018f6c5e-8557-7888-8123-456789abcdef',
      '018f6c5e-8557-7888-8123-456789abcdee',
    );
    expect(res.invitationId).toBe('inv-1');
  });

  it('delegates preview to service', async () => {
    service.preview.mockResolvedValue({
      invitationId: 'inv-1',
      staffName: 'Staff A',
      placeName: 'Place A',
      expiresAt: '2026-10-30T00:00:00.000Z',
    });

    const res = await controller.preview('clerk-1', {
      code: 'abcdefghijklmnopqrstuvwx',
    });

    expect(service.preview).toHaveBeenCalledWith(
      'clerk-1',
      'abcdefghijklmnopqrstuvwx',
    );
    expect(res.staffName).toBe('Staff A');
  });

  it('delegates submit to service', async () => {
    service.submit.mockResolvedValue({
      invitationId: 'inv-1',
      status: 'PENDING',
      expiresAt: '2026-10-30T00:00:00.000Z',
    });

    const res = await controller.submit('clerk-1', {
      code: 'abcdefghijklmnopqrstuvwx',
    });

    expect(service.submit).toHaveBeenCalledWith(
      'clerk-1',
      'abcdefghijklmnopqrstuvwx',
    );
    expect(res.status).toBe('PENDING');
  });

  it('delegates decide to service', async () => {
    service.decide.mockResolvedValue({
      invitationId: 'inv-1',
      status: 'APPROVED',
    });

    const res = await controller.decide(
      'clerk-1',
      {
        place_id: '018f6c5e-8557-7888-8123-456789abcdef',
        invitation_id: '018f6c5e-8557-7888-8123-456789abcdee',
      },
      {
        decision: 'APPROVE',
      },
    );

    expect(service.decide).toHaveBeenCalledWith(
      'clerk-1',
      '018f6c5e-8557-7888-8123-456789abcdef',
      '018f6c5e-8557-7888-8123-456789abcdee',
      'APPROVE',
    );
    expect(res.status).toBe('APPROVED');
  });

  it('delegates unlink to service', async () => {
    service.unlink.mockResolvedValue(undefined);

    await controller.unlink('clerk-1', {
      place_id: '018f6c5e-8557-7888-8123-456789abcdef',
      staff_id: '018f6c5e-8557-7888-8123-456789abcdee',
    });

    expect(service.unlink).toHaveBeenCalledWith(
      'clerk-1',
      '018f6c5e-8557-7888-8123-456789abcdef',
      '018f6c5e-8557-7888-8123-456789abcdee',
    );
  });
});
