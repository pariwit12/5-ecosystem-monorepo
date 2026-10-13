import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PersonController } from './person.controller';

import { CreatePersonHandler } from './commands/create-person.handler';
import { CreateDentalPatientHandler } from './commands/create-dental-patient.handler';
import { ClaimStaffInvitationHandler } from './commands/claim-staff-invitation.handler';
import { PatientNumberService } from './services/patient-number.service';
import { DentalClinicStaffAccessService } from './services/dental-clinic-staff-access.service';
import { GetDentalPatientsHandler } from './queries/get-dental-patients.handler';
import { GetDentalPatientByIdHandler } from './queries/get-dental-patient-by-id.handler';
import { UpdateDentalPatientHandler } from './commands/update-dental-patient.handler';

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [
  CreatePersonHandler,
  CreateDentalPatientHandler,
  ClaimStaffInvitationHandler,
  UpdateDentalPatientHandler,
];
const QueryHandlers = [GetDentalPatientsHandler, GetDentalPatientByIdHandler];

@Module({
  imports: [CqrsModule],
  controllers: [PersonController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    PatientNumberService,
    DentalClinicStaffAccessService,
  ],
  exports: [PatientNumberService],
})
export class PersonModule {}
