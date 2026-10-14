import { ForbiddenException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DentalClinicStaffAccessService } from '../services/dental-clinic-staff-access.service';
import {
  GetDentalPatientsQuery,
  GetDentalPatientsResponse,
} from './get-dental-patients.query';

const PATIENT_READ_ROLES = new Set([
  'ADMIN',
  'MANAGER',
  'RECEPTIONIST',
  'DENTIST',
]);

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
    const { role } = await this.staffAccess.verify(
      clerkId,
      query.organizationDentalClinicId,
    );

    if (!PATIENT_READ_ROLES.has(role)) {
      throw new ForbiddenException('ไม่มีสิทธิ์ดูข้อมูลคนไข้');
    }

    const isDentist = role === 'DENTIST';
    const search = query.search || undefined;
    const searchFields: Prisma.PersonWhereInput[] = [
      { firstName: { contains: search ?? '', mode: 'insensitive' } },
      { lastName: { contains: search ?? '', mode: 'insensitive' } },
    ];
    if (!isDentist) {
      searchFields.push(
        { nickname: { contains: search ?? '', mode: 'insensitive' } },
        { phone: { contains: search ?? '' } },
        {
          identityDocuments: {
            some: { normalizedValue: (search ?? '').toUpperCase() },
          },
        },
      );
    }

    const where: Prisma.PersonDentalPatientAffiliationWhereInput = {
      organizationDentalClinicId: query.organizationDentalClinicId,
      ...(search
        ? {
            OR: [
              { patientNumber: { contains: search ?? '', mode: 'insensitive' } },
              {
                personDentalPatient: {
                  person: { OR: searchFields },
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
                  ...(isDentist
                    ? {}
                    : {
                        nickname: true,
                        phone: true,
                        birthDate: true,
                      }),
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
      patients: rows.map((row) => {
        const person = row.personDentalPatient.person;
        return {
          personId: person.id,
          patientNumber: row.patientNumber,
          firstName: person.firstName,
          lastName: person.lastName,
          ...(!isDentist && 'nickname' in person
            ? {
                nickname: person.nickname,
                phone: person.phone,
                birthDate: person.birthDate,
              }
            : {}),
        };
      }),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }
}
