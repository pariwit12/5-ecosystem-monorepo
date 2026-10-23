import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  PreviewStaffInvitationQuery,
  PreviewStaffInvitationResponse,
} from './preview-staff-invitation.query';
import { WorkScheduleStaffInvitationService } from '../work-schedule-staff-invitation.service';

@QueryHandler(PreviewStaffInvitationQuery)
export class PreviewStaffInvitationHandler implements IQueryHandler<
  PreviewStaffInvitationQuery,
  PreviewStaffInvitationResponse
> {
  constructor(private readonly service: WorkScheduleStaffInvitationService) {}

  async execute(
    query: PreviewStaffInvitationQuery,
  ): Promise<PreviewStaffInvitationResponse> {
    return this.service.preview(query.clerkId, query.body.code);
  }
}
