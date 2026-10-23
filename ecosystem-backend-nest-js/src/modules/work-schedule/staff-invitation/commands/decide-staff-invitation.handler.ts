import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import {
  DecideStaffInvitationCommand,
  DecideStaffInvitationResponse,
} from './decide-staff-invitation.command';
import { WorkScheduleStaffInvitationService } from '../work-schedule-staff-invitation.service';

@CommandHandler(DecideStaffInvitationCommand)
export class DecideStaffInvitationHandler implements ICommandHandler<
  DecideStaffInvitationCommand,
  DecideStaffInvitationResponse
> {
  constructor(private readonly service: WorkScheduleStaffInvitationService) {}

  async execute(
    command: DecideStaffInvitationCommand,
  ): Promise<DecideStaffInvitationResponse> {
    return this.service.decide(
      command.clerkId,
      command.param.place_id,
      command.param.invitation_id,
      command.body.decision,
    );
  }
}
