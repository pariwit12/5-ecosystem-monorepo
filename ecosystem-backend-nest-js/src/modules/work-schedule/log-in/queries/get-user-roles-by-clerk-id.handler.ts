import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  GetUserRolesByClerkIdQuery,
  GetUserRolesByClerkIdResponse,
} from './get-user-roles-by-clerk-id.query';

import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

@QueryHandler(GetUserRolesByClerkIdQuery)
export class GetUserRolesByClerkIdHandler implements IQueryHandler<
  GetUserRolesByClerkIdQuery,
  GetUserRolesByClerkIdResponse
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    query: GetUserRolesByClerkIdQuery,
  ): Promise<GetUserRolesByClerkIdResponse> {
    const { clerkId } = query;

    const { personId } = await this.accessControlService.verifyPerson(clerkId);

    // ==========================================
    // 🚀 3. THE PRISMA MAGIC (Parallel Execution)
    // ==========================================
    // ใช้ Promise.all เพื่อยิง 2 คำสั่งเข้าไปหา Database พร้อมๆ กัน (ประหยัดเวลาลงครึ่งนึง!)
    const [placesAsAdmin, placesAsStaff] = await Promise.all([
      // ก้อนที่ 1: ค้นหาสถานที่ที่คนๆ นี้เป็น "Admin"
      this.prisma.organizationWorkSchedulePlace.findMany({
        where: {
          deletedAt: null,
          workScheduleAdmins: {
            some: {
              personId: personId,
              deletedAt: null,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      }),

      // ก้อนที่ 2: ค้นหาสถานที่ที่คนๆ นี้เป็น "Staff"
      this.prisma.organizationWorkSchedulePlace.findMany({
        where: {
          deletedAt: null,
          workScheduleStaffs: {
            some: {
              personId: personId,
              deletedAt: null,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      placesAsAdmin: placesAsAdmin.map((place) => ({
        id: place.id,
        name: place.name,
      })),
      placesAsStaff: placesAsStaff.map((place) => ({
        id: place.id,
        name: place.name,
      })),
    };
  }
}
