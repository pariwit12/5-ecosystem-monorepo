import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import {
  GetDentalPatientsDtoQuery,
  GetDentalPatientsQuery,
  type GetDentalPatientsResponse,
} from './queries/get-dental-patients.query';
import {
  GetDentalPatientByIdDtoParam,
  GetDentalPatientByIdDtoQuery,
  GetDentalPatientByIdQuery,
  type GetDentalPatientByIdResponse,
} from './queries/get-dental-patient-by-id.query';
import {
  UpdateDentalPatientBody,
  UpdateDentalPatientCommand,
  type UpdateDentalPatientResponse,
} from './commands/update-dental-patient.command';

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

  @Get('dental-patients')
  @UseGuards(ClerkAuthGuard)
  async getDentalPatients(
    @ClerkUser() clerkUser: ClerkUserData,
    @Query() query: GetDentalPatientsDtoQuery,
  ): Promise<GetDentalPatientsResponse> {
    return this.queryBus.execute<
      GetDentalPatientsQuery,
      GetDentalPatientsResponse
    >(new GetDentalPatientsQuery(clerkUser.sub, query));
  }

  @Get('dental-patients/:person_id')
  @UseGuards(ClerkAuthGuard)
  async getDentalPatientById(
    @ClerkUser() clerkUser: ClerkUserData,
    @Param() param: GetDentalPatientByIdDtoParam,
    @Query() query: GetDentalPatientByIdDtoQuery,
  ): Promise<GetDentalPatientByIdResponse> {
    return this.queryBus.execute<
      GetDentalPatientByIdQuery,
      GetDentalPatientByIdResponse
    >(
      new GetDentalPatientByIdQuery(
        clerkUser.sub,
        param.person_id,
        query.organizationDentalClinicId,
      ),
    );
  }

  @Patch('dental-patients/:person_id')
  @UseGuards(ClerkAuthGuard)
  async updateDentalPatient(
    @ClerkUser() clerkUser: ClerkUserData,
    @Param() param: GetDentalPatientByIdDtoParam,
    @Query() query: GetDentalPatientByIdDtoQuery,
    @Body() body: UpdateDentalPatientBody,
  ): Promise<UpdateDentalPatientResponse> {
    return this.commandBus.execute<
      UpdateDentalPatientCommand,
      UpdateDentalPatientResponse
    >(
      new UpdateDentalPatientCommand(
        clerkUser.sub,
        param.person_id,
        query.organizationDentalClinicId,
        body,
      ),
    );
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
