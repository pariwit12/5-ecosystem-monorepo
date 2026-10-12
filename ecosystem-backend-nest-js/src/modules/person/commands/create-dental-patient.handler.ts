import { ForbiddenException, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { PatientNumberService } from '../services/patient-number.service';
import {
  CreateDentalPatientCommand,
  CreateDentalPatientResponse,
} from './create-dental-patient.command';

@Injectable()
@CommandHandler(CreateDentalPatientCommand)
export class CreateDentalPatientHandler implements ICommandHandler<
  CreateDentalPatientCommand,
  CreateDentalPatientResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientNumberService: PatientNumberService,
  ) {}

  async execute(
    command: CreateDentalPatientCommand,
  ): Promise<CreateDentalPatientResponse> {
    const { clerkId, body } = command;

    return this.prisma.$transaction(async (tx) => {
      const creator = await tx.person.findUnique({
        where: { clerkId },
        select: {
          staff: {
            select: {
              clinicAffiliations: {
                where: {
                  organizationDentalClinicId: body.organizationDentalClinicId,
                },
                select: { personStaffId: true },
              },
            },
          },
        },
      });

      if (!creator?.staff?.clinicAffiliations.length) {
        throw new ForbiddenException('ผู้สร้างต้องเป็นพนักงานของคลินิกนี้');
      }

      let person = body.cid
        ? await tx.person.findUnique({ where: { cid: body.cid } })
        : null;
      let createdPerson = false;

      if (!person) {
        person = await tx.person.create({
          data: {
            firstName: body.firstName,
            lastName: body.lastName,
            cid: body.cid,
            phone: body.phone,
            birthDate: body.birthDate,
          },
        });
        createdPerson = true;
      }

      let dentalPatient = await tx.personDentalPatient.findUnique({
        where: { personId: person.id },
      });
      let createdPatient = false;

      if (!dentalPatient) {
        dentalPatient = await tx.personDentalPatient.create({
          data: { personId: person.id },
        });
        createdPatient = true;
      }

      const existingAffiliation =
        await tx.personDentalPatientAffiliation.findUnique({
          where: {
            personDentalPatientId_organizationDentalClinicId: {
              personDentalPatientId: dentalPatient.personId,
              organizationDentalClinicId: body.organizationDentalClinicId,
            },
          },
          select: { patientNumber: true },
        });

      if (existingAffiliation) {
        return {
          personId: person.id,
          patientNumber: existingAffiliation.patientNumber,
          createdPerson,
          createdPatient,
          createdAffiliation: false,
        };
      }

      const patientNumber =
        await this.patientNumberService.allocateNextInTransaction(
          tx,
          body.organizationDentalClinicId,
        );

      await tx.personDentalPatientAffiliation.create({
        data: {
          personDentalPatientId: dentalPatient.personId,
          organizationDentalClinicId: body.organizationDentalClinicId,
          patientNumber,
        },
      });

      return {
        personId: person.id,
        patientNumber,
        createdPerson,
        createdPatient,
        createdAffiliation: true,
      };
    });
  }
}
