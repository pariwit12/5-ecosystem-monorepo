import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OrganizationsController } from './organizations.controller';

import { CreateOrganizationHandler } from './commands/create-organization.handler';
import { UpdateOrganizationByIdHandler } from './commands/update-organization-by-id.handler';
import { GetOrganizationsHandler } from './queries/get-organizations.handler';
import { GetOrganizationByIdHandler } from './queries/get-organization-by-id.handler';
import { CreateDentalClinicHandler } from './commands/create-dental-clinic.handler';

// มัดรวมไว้ในตัวแปรจะได้ดูสะอาดตา
const CommandHandlers = [
  CreateOrganizationHandler,
  UpdateOrganizationByIdHandler,
  CreateDentalClinicHandler,
];
const QueryHandlers = [GetOrganizationsHandler, GetOrganizationByIdHandler];

// 🌟 ไม่ต้องใส่ PrismaModule หรือ PrismaService แล้ว เพราะมันเป็น Global (ตั้งไว้ใน prisma.module.ts)
@Module({
  imports: [CqrsModule],
  controllers: [OrganizationsController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class OrganizationsModule {}
