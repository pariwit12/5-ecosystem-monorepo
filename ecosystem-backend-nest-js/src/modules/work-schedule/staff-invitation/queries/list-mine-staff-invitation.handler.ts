import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ListMineStaffInvitationsQuery,
  ListMineStaffInvitationsResponse,
} from './list-mine-staff-invitation.query';
import { WorkScheduleStaffInvitationService } from '../work-schedule-staff-invitation.service';

@QueryHandler(ListMineStaffInvitationsQuery)
export class ListMineStaffInvitationsHandler implements IQueryHandler<
  ListMineStaffInvitationsQuery,
  ListMineStaffInvitationsResponse
> {
  constructor(private readonly service: WorkScheduleStaffInvitationService) {}

  async execute(
    query: ListMineStaffInvitationsQuery,
  ): Promise<ListMineStaffInvitationsResponse> {
    return this.service.listMine(query.clerkId);
  }
}
