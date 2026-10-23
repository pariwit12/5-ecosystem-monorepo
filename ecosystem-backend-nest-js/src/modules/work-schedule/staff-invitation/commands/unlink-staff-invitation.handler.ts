import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { UnlinkStaffInvitationCommand } from './unlink-staff-invitation.command';
import { WorkScheduleStaffInvitationService } from '../work-schedule-staff-invitation.service';

@CommandHandler(UnlinkStaffInvitationCommand)
export class UnlinkStaffInvitationHandler implements ICommandHandler<
  UnlinkStaffInvitationCommand,
  void
> {
  constructor(private readonly service: WorkScheduleStaffInvitationService) {}

  async execute(command: UnlinkStaffInvitationCommand): Promise<void> {
    await this.service.unlink(
      command.clerkId,
      command.param.place_id,
      command.param.staff_id,
    );
  }
}
