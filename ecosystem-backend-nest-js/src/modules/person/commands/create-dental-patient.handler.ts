import { ForbiddenException, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PatientNumberService } from '../services/patient-number.service';
import {
  CreateDentalPatientCommand,
  CreateDentalPatientResponse,
} from './create-dental-patient.command';
import { legacyCidDocument } from '../identity-document';

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
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.executeTransaction(command);
      } catch (error) {
        if (
          attempt >= 3 ||
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          !['P2034', 'P2002'].includes(error.code)
        ) {
          throw error;
        }
      }
    }
  }

  private async executeTransaction(
    command: CreateDentalPatientCommand,
  ): Promise<CreateDentalPatientResponse> {
    const { clerkId, body } = command;

    return this.prisma.$transaction(
      async (tx) => {
        const creator = await tx.userAccount.findUnique({
          where: { clerkId },
          select: {
            person: {
              select: {
                staff: {
                  select: {
                    clinicAffiliations: {
                      where: {
                        organizationDentalClinicId:
                          body.organizationDentalClinicId,
                        organizationDentalClinic: {
                          deletedAt: null,
                          organization: { deletedAt: null },
                        },
                      },
                      select: { role: true },
                      take: 1,
                    },
                  },
                },
                dentist: {
                  select: {
                    clinicAffiliations: {
                      where: {
                        organizationDentalClinicId:
                          body.organizationDentalClinicId,
                        organizationDentalClinic: {
                          deletedAt: null,
                          organization: { deletedAt: null },
                        },
                      },
                      select: { personDentistId: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        });

        const staffRole = creator?.person?.staff?.clinicAffiliations[0]?.role;
        const isAdmin = staffRole === 'ADMIN';
        const isDentist =
          (creator?.person?.dentist?.clinicAffiliations.length ?? 0) > 0;

        if (!isAdmin && !isDentist) {
          throw new ForbiddenException(
            'เฉพาะทันตแพทย์หรือผู้ดูแลระบบของคลินิกนี้เท่านั้นที่สร้างคนไข้ได้',
          );
        }

        // Dentists can create the patient profile, but identity numbers remain
        // restricted to admins until a more specific product rule is approved.
        if (!isAdmin && (body.cid || body.identityDocument)) {
          throw new ForbiddenException(
            'ทันตแพทย์ไม่มีสิทธิ์บันทึกเลขเอกสารยืนยันตัวตน',
          );
        }

        const identityDocument = body.identityDocument
          ? body.identityDocument
          : body.cid
            ? legacyCidDocument(body.cid)
            : null;
        const existingIdentity = identityDocument
          ? await tx.personIdentityDocument.findUnique({
              where: {
                type_issuingCountry_normalizedValue: {
                  type: identityDocument.type,
                  issuingCountry: identityDocument.issuingCountry,
                  normalizedValue: identityDocument.value,
                },
              },
              include: { person: true },
            })
          : null;
        let person = existingIdentity?.person ?? null;
        let createdPerson = false;

        if (!person) {
          person = await tx.person.create({
            data: {
              firstName: body.firstName,
              lastName: body.lastName,
              phone: body.phone,
              birthDate: body.birthDate,
              identityDocuments: identityDocument
                ? {
                    create: {
                      type: identityDocument.type,
                      issuingCountry: identityDocument.issuingCountry,
                      normalizedValue: identityDocument.value,
                      expiresAt: identityDocument.expiresAt,
                    },
                  }
                : undefined,
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
