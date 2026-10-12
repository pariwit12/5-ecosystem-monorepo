import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../common/guards/clerk-user.decorator';

import { CreatePersonCommand } from './commands/create-person.command';
import {
  CreateDentalPatientBody,
  CreateDentalPatientCommand,
  type CreateDentalPatientResponse,
} from './commands/create-dental-patient.command';
import {
  ClaimStaffInvitationBody,
  ClaimStaffInvitationCommand,
} from './commands/claim-staff-invitation.command';

@Controller('api/person')
export class PersonController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ==========================================
  // [POST] Business Logic
  // ==========================================

  @Post('')
  @UseGuards(ClerkAuthGuard)
  async createPerson(@ClerkUser() clerkUser: ClerkUserData) {
    return this.commandBus.execute<CreatePersonCommand, void>(
      new CreatePersonCommand(clerkUser.sub),
    );
  }

  @Post('dental-patients')
  @UseGuards(ClerkAuthGuard)
  async createDentalPatient(
    @ClerkUser() clerkUser: ClerkUserData,
    @Body() body: CreateDentalPatientBody,
  ): Promise<CreateDentalPatientResponse> {
    return this.commandBus.execute<
      CreateDentalPatientCommand,
      CreateDentalPatientResponse
    >(new CreateDentalPatientCommand(clerkUser.sub, body));
  }

  @Post('staff-invitations/claim')
  @UseGuards(ClerkAuthGuard)
  async claimStaffInvitation(
    @ClerkUser() clerkUser: ClerkUserData,
    @Body() body: ClaimStaffInvitationBody,
  ) {
    return this.commandBus.execute<
      ClaimStaffInvitationCommand,
      { organizationDentalClinicId: string; role: string }
    >(new ClaimStaffInvitationCommand(clerkUser.sub, body.code));
  }
}
