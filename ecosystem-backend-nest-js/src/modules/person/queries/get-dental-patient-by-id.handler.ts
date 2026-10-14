import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { DentalClinicStaffAccessService } from '../services/dental-clinic-staff-access.service';
import {
  GetDentalPatientByIdQuery,
  GetDentalPatientByIdResponse,
} from './get-dental-patient-by-id.query';

const PATIENT_READ_ROLES = new Set([
  'ADMIN',
  'MANAGER',
  'RECEPTIONIST',
  'DENTIST',
]);

@QueryHandler(GetDentalPatientByIdQuery)
export class GetDentalPatientByIdHandler implements IQueryHandler<
  GetDentalPatientByIdQuery,
  GetDentalPatientByIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAccess: DentalClinicStaffAccessService,
  ) {}

  async execute(
    query: GetDentalPatientByIdQuery,
  ): Promise<GetDentalPatientByIdResponse> {
    const { role } = await this.staffAccess.verify(
      query.clerkId,
      query.organizationDentalClinicId,
    );

    if (!PATIENT_READ_ROLES.has(role)) {
      throw new ForbiddenException('ไม่มีสิทธิ์ดูข้อมูลคนไข้');
    }

    const isDentist = role === 'DENTIST';
    const affiliation =
      await this.prisma.personDentalPatientAffiliation.findUnique({
        where: {
          personDentalPatientId_organizationDentalClinicId: {
            personDentalPatientId: query.personId,
            organizationDentalClinicId: query.organizationDentalClinicId,
          },
        },
        select: {
          patientNumber: true,
          personDentalPatient: {
            select: {
              person: {
                select: {
                  id: true,
                  version: true,
                  firstName: true,
                  lastName: true,
                  nickname: true,
                  phone: true,
                  birthDate: true,
                  identityDocuments: {
                    select: {
                      type: true,
                      issuingCountry: true,
                      normalizedValue: true,
                      expiresAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!affiliation) throw new NotFoundException('ไม่พบคนไข้ในคลินิกนี้');

    const person = affiliation.personDentalPatient.person;
    const response: GetDentalPatientByIdResponse = {
      personId: person.id,
      version: person.version,
      patientNumber: affiliation.patientNumber,
      firstName: person.firstName,
      lastName: person.lastName,
    };

    if (!isDentist) {
      response.nickname = person.nickname;
      response.phone = person.phone;
      response.cid =
        person.identityDocuments.find(
          (document) => document.type === 'THAI_CID',
        )?.normalizedValue ?? null;
      response.identityDocuments = person.identityDocuments.map((document) => ({
        type: document.type,
        issuingCountry: document.issuingCountry,
        value: document.normalizedValue,
        expiresAt: document.expiresAt,
      }));
      response.birthDate = person.birthDate;
    }

    return response;
  }
}
