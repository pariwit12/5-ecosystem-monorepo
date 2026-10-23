import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import { ClerkUser } from '../../../common/guards/clerk-user.decorator';
import { WorkScheduleStaffInvitationService } from './work-schedule-staff-invitation.service';
import {
  IssueStaffInvitationParamDto,
  IssueStaffInvitationResponse,
} from './commands/issue-staff-invitation.command';
import {
  PreviewStaffInvitationBodyDto,
  PreviewStaffInvitationResponse,
} from './queries/preview-staff-invitation.query';
import {
  SubmitStaffInvitationBodyDto,
  SubmitStaffInvitationResponse,
} from './commands/submit-staff-invitation.command';
import { ListMineStaffInvitationsResponse } from './queries/list-mine-staff-invitation.query';
import {
  ListStaffInvitationsByPlaceParamDto,
  ListStaffInvitationsByPlaceResponse,
} from './queries/list-by-place-staff-invitation.query';
import {
  DecideStaffInvitationBodyDto,
  DecideStaffInvitationParamDto,
  DecideStaffInvitationResponse,
} from './commands/decide-staff-invitation.command';
import { UnlinkStaffInvitationParamDto } from './commands/unlink-staff-invitation.command';

@Controller('api/work-schedule/staff-invitations')
@UseGuards(ClerkAuthGuard)
export class WorkScheduleStaffInvitationController {
  constructor(
    private readonly staffInvitationService: WorkScheduleStaffInvitationService,
  ) {}

  // 1. Issue: POST /places/:place_id/staff/:staff_id/issue
  @Post('places/:place_id/staff/:staff_id/issue')
  async issue(
    @ClerkUser('sub') clerkId: string,
    @Param() param: IssueStaffInvitationParamDto,
  ): Promise<IssueStaffInvitationResponse> {
    return this.staffInvitationService.issue(
      clerkId,
      param.place_id,
      param.staff_id,
    );
  }

  // 2. Preview: POST /preview
  @Post('preview')
  async preview(
    @ClerkUser('sub') clerkId: string,
    @Body() body: PreviewStaffInvitationBodyDto,
  ): Promise<PreviewStaffInvitationResponse> {
    return this.staffInvitationService.preview(clerkId, body.code);
  }

  // 3. Submit: POST /submit
  @Post('submit')
  async submit(
    @ClerkUser('sub') clerkId: string,
    @Body() body: SubmitStaffInvitationBodyDto,
  ): Promise<SubmitStaffInvitationResponse> {
    return this.staffInvitationService.submit(clerkId, body.code);
  }

  // 4. List Mine: GET /mine
  @Get('mine')
  async listMine(
    @ClerkUser('sub') clerkId: string,
  ): Promise<ListMineStaffInvitationsResponse> {
    return this.staffInvitationService.listMine(clerkId);
  }

  // 5. List By Place: GET /places/:place_id
  @Get('places/:place_id')
  async listByPlace(
    @ClerkUser('sub') clerkId: string,
    @Param() param: ListStaffInvitationsByPlaceParamDto,
  ): Promise<ListStaffInvitationsByPlaceResponse> {
    return this.staffInvitationService.listByPlace(clerkId, param.place_id);
  }

  // 6. Decide: POST /places/:place_id/:invitation_id/decision
  @Post('places/:place_id/:invitation_id/decision')
  async decide(
    @ClerkUser('sub') clerkId: string,
    @Param() param: DecideStaffInvitationParamDto,
    @Body() body: DecideStaffInvitationBodyDto,
  ): Promise<DecideStaffInvitationResponse> {
    return this.staffInvitationService.decide(
      clerkId,
      param.place_id,
      param.invitation_id,
      body.decision,
    );
  }

  // 7. Unlink: DELETE /places/:place_id/staff/:staff_id/link
  @Delete('places/:place_id/staff/:staff_id/link')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlink(
    @ClerkUser('sub') clerkId: string,
    @Param() param: UnlinkStaffInvitationParamDto,
  ): Promise<void> {
    await this.staffInvitationService.unlink(
      clerkId,
      param.place_id,
      param.staff_id,
    );
  }
}
