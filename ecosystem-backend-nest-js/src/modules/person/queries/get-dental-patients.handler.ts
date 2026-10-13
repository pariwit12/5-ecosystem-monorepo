import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DentalClinicStaffAccessService } from '../services/dental-clinic-staff-access.service';
import {
  GetDentalPatientsQuery,
  GetDentalPatientsResponse,
} from './get-dental-patients.query';

@QueryHandler(GetDentalPatientsQuery)
export class GetDentalPatientsHandler implements IQueryHandler<
  GetDentalPatientsQuery,
  GetDentalPatientsResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffAccess: DentalClinicStaffAccessService,
  ) {}

  async execute(
    request: GetDentalPatientsQuery,
  ): Promise<GetDentalPatientsResponse> {
    const { clerkId, query } = request;
    await this.staffAccess.verify(clerkId, query.organizationDentalClinicId);

    const search = query.search || undefined;
    const where: Prisma.PersonDentalPatientAffiliationWhereInput = {
      organizationDentalClinicId: query.organizationDentalClinicId,
      ...(search
        ? {
            OR: [
              { patientNumber: { contains: search, mode: 'insensitive' } },
              {
                personDentalPatient: {
                  person: {
                    OR: [
                      { firstName: { contains: search, mode: 'insensitive' } },
                      { lastName: { contains: search, mode: 'insensitive' } },
                      { nickname: { contains: search, mode: 'insensitive' } },
                      { phone: { contains: search } },
                      {
                        identityDocuments: {
                          some: { normalizedValue: search.toUpperCase() },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.personDentalPatientAffiliation.findMany({
        where,
        select: {
          patientNumber: true,
          personDentalPatient: {
            select: {
              person: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  nickname: true,
                  phone: true,
                  birthDate: true,
                },
              },
            },
          },
        },
        orderBy: [
          { personDentalPatient: { person: { firstName: 'asc' } } },
          { personDentalPatient: { person: { lastName: 'asc' } } },
        ],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.personDentalPatientAffiliation.count({ where }),
    ]);

    return {
      patients: rows.map((row) => ({
        personId: row.personDentalPatient.person.id,
        patientNumber: row.patientNumber,
        firstName: row.personDentalPatient.person.firstName,
        lastName: row.personDentalPatient.person.lastName,
        nickname: row.personDentalPatient.person.nickname,
        phone: row.personDentalPatient.person.phone,
        birthDate: row.personDentalPatient.person.birthDate,
      })),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }
}
