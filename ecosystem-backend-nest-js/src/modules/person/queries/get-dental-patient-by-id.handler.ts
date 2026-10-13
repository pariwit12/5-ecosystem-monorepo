import { NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { DentalClinicStaffAccessService } from '../services/dental-clinic-staff-access.service';
import {
  GetDentalPatientByIdQuery,
  GetDentalPatientByIdResponse,
} from './get-dental-patient-by-id.query';

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
    await this.staffAccess.verify(
      query.clerkId,
      query.organizationDentalClinicId,
    );

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
                  cid: true,
                  birthDate: true,
                },
              },
            },
          },
        },
      });

    if (!affiliation) throw new NotFoundException('ไม่พบคนไข้ในคลินิกนี้');

    return {
      personId: affiliation.personDentalPatient.person.id,
      version: affiliation.personDentalPatient.person.version,
      patientNumber: affiliation.patientNumber,
      firstName: affiliation.personDentalPatient.person.firstName,
      lastName: affiliation.personDentalPatient.person.lastName,
      nickname: affiliation.personDentalPatient.person.nickname,
      phone: affiliation.personDentalPatient.person.phone,
      cid: affiliation.personDentalPatient.person.cid,
      birthDate: affiliation.personDentalPatient.person.birthDate,
    };
  }
}
