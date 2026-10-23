import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WorkScheduleStaffInvitationController } from './work-schedule-staff-invitation.controller';
import { WorkScheduleStaffInvitationService } from './work-schedule-staff-invitation.service';
import { IssueStaffInvitationHandler } from './commands/issue-staff-invitation.handler';
import { SubmitStaffInvitationHandler } from './commands/submit-staff-invitation.handler';
import { DecideStaffInvitationHandler } from './commands/decide-staff-invitation.handler';
import { UnlinkStaffInvitationHandler } from './commands/unlink-staff-invitation.handler';
import { PreviewStaffInvitationHandler } from './queries/preview-staff-invitation.handler';
import { ListMineStaffInvitationsHandler } from './queries/list-mine-staff-invitation.handler';
import { ListStaffInvitationsByPlaceHandler } from './queries/list-by-place-staff-invitation.handler';
import { AccessControlModule } from '../../../common/access-control/access-control.module';

@Module({
  imports: [CqrsModule, AccessControlModule],
  controllers: [WorkScheduleStaffInvitationController],
  providers: [
    WorkScheduleStaffInvitationService,
    IssueStaffInvitationHandler,
    SubmitStaffInvitationHandler,
    DecideStaffInvitationHandler,
    UnlinkStaffInvitationHandler,
    PreviewStaffInvitationHandler,
    ListMineStaffInvitationsHandler,
    ListStaffInvitationsByPlaceHandler,
  ],
  exports: [WorkScheduleStaffInvitationService],
})
export class WorkScheduleStaffInvitationModule {}
