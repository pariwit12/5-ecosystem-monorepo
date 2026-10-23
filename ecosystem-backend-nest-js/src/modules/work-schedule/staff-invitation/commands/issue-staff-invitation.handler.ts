import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import {
  IssueStaffInvitationCommand,
  IssueStaffInvitationResponse,
} from './issue-staff-invitation.command';
import { WorkScheduleStaffInvitationService } from '../work-schedule-staff-invitation.service';

@CommandHandler(IssueStaffInvitationCommand)
export class IssueStaffInvitationHandler implements ICommandHandler<
  IssueStaffInvitationCommand,
  IssueStaffInvitationResponse
> {
  constructor(private readonly service: WorkScheduleStaffInvitationService) {}

  async execute(
    command: IssueStaffInvitationCommand,
  ): Promise<IssueStaffInvitationResponse> {
    return this.service.issue(
      command.clerkId,
      command.param.place_id,
      command.param.staff_id,
    );
  }
}
