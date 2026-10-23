import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import {
  SubmitStaffInvitationCommand,
  SubmitStaffInvitationResponse,
} from './submit-staff-invitation.command';
import { WorkScheduleStaffInvitationService } from '../work-schedule-staff-invitation.service';

@CommandHandler(SubmitStaffInvitationCommand)
export class SubmitStaffInvitationHandler implements ICommandHandler<
  SubmitStaffInvitationCommand,
  SubmitStaffInvitationResponse
> {
  constructor(private readonly service: WorkScheduleStaffInvitationService) {}

  async execute(
    command: SubmitStaffInvitationCommand,
  ): Promise<SubmitStaffInvitationResponse> {
    return this.service.submit(command.clerkId, command.body.code);
  }
}
