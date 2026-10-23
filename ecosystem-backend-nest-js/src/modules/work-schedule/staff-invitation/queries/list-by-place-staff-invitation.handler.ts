import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  ListStaffInvitationsByPlaceQuery,
  ListStaffInvitationsByPlaceResponse,
} from './list-by-place-staff-invitation.query';
import { WorkScheduleStaffInvitationService } from '../work-schedule-staff-invitation.service';

@QueryHandler(ListStaffInvitationsByPlaceQuery)
export class ListStaffInvitationsByPlaceHandler implements IQueryHandler<
  ListStaffInvitationsByPlaceQuery,
  ListStaffInvitationsByPlaceResponse
> {
  constructor(private readonly service: WorkScheduleStaffInvitationService) {}

  async execute(
    query: ListStaffInvitationsByPlaceQuery,
  ): Promise<ListStaffInvitationsByPlaceResponse> {
    return this.service.listByPlace(query.clerkId, query.param.place_id);
  }
}
