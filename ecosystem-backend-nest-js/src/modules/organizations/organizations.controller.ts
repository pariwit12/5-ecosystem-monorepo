import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../common/guards/clerk-user.decorator';

import {
  GetOrganizationsQuery,
  GetOrganizationsResponse,
} from './queries/get-organizations.query';
import {
  GetOrganizationByIdQuery,
  GetOrganizationByIdResponse,
  GetOrganizationByIdDtoParam,
} from './queries/get-organization-by-id.query';
import {
  CreateOrganizationCommand,
  CreateOrganizationResponse,
  CreateOrganizationDtoBody,
} from './commands/create-organization.command';
import {
  UpdateOrganizationByIdCommand,
  UpdateOrganizationByIdResponse,
  UpdateOrganizationByIdDtoParam,
  UpdateOrganizationByIdDtoBody,
} from './commands/update-organization-by-id.command';
import {
  CreateDentalClinicBody,
  CreateDentalClinicCommand,
} from './commands/create-dental-clinic.command';

@Controller('api/organizations')
export class OrganizationsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ==========================================
  // [GET] ดึงรายชื่อองค์กรทั้งหมดของผู้ใช้คนนี้
  // ==========================================

  @Get()
  @UseGuards(ClerkAuthGuard)
  async getOrganizations(@ClerkUser() clerkUser: ClerkUserData) {
    return this.queryBus.execute<
      GetOrganizationsQuery,
      GetOrganizationsResponse
    >(new GetOrganizationsQuery(clerkUser.sub));
  }

  // ==========================================
  // [POST] สร้างคลินิกใหม่ + ผูกสิทธิ์ให้ผู้สร้างทันที
  // ==========================================

  @Post()
  @UseGuards(ClerkAuthGuard)
  async createOrganization(
    // ตรวจข้อมูลตามลำดับ (ซ้ายไปขวา, บนลงล่าง) ดังนั้นให้ไล่เป็น @Param (เบาสุด), @Query, @Body (หนักสุด), @ClerkUser (และอื่นๆ ที่ไม่ต้องตรวจ)
    @Body() body: CreateOrganizationDtoBody, // 🌟 ใช้ DTO จากไฟล์ Command / Query
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<
      CreateOrganizationCommand,
      CreateOrganizationResponse
    >(new CreateOrganizationCommand(clerkUser.sub, body));
  }

  @Post(':organization_id/dental-clinics')
  @UseGuards(ClerkAuthGuard)
  async createDentalClinic(
    @Param('organization_id') organizationId: string,
    @Body() body: CreateDentalClinicBody,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<CreateDentalClinicCommand, { id: string }>(
      new CreateDentalClinicCommand(clerkUser.sub, organizationId, body),
    );
  }

  // ==========================================
  // [GET] ดึงข้อมูลองค์กรโดย ID (สำหรับหน้า Settings ขององค์กรที่เลือก = หน้าต่าง organizations/settings)
  // ==========================================

  @Get(':organization_id')
  @UseGuards(ClerkAuthGuard)
  async getOrganizationById(
    // ตรวจข้อมูลตามลำดับ (ซ้ายไปขวา, บนลงล่าง) ดังนั้นให้ไล่เป็น @Param (เบาสุด), @Query, @Body (หนักสุด), @ClerkUser (และอื่นๆ ที่ไม่ต้องตรวจ)
    @Param() param: GetOrganizationByIdDtoParam, // 🌟 ใช้ DTO จากไฟล์ Command / Query
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetOrganizationByIdQuery,
      GetOrganizationByIdResponse
    >(new GetOrganizationByIdQuery(clerkUser.sub, param));
  }

  // ==========================================
  // [PATCH]
  // ==========================================

  @Patch(':organization_id')
  @UseGuards(ClerkAuthGuard)
  async updateOrganizationById(
    // ตรวจข้อมูลตามลำดับ (ซ้ายไปขวา, บนลงล่าง) ดังนั้นให้ไล่เป็น @Param (เบาสุด), @Query, @Body (หนักสุด), @ClerkUser (และอื่นๆ ที่ไม่ต้องตรวจ)
    @Param() param: UpdateOrganizationByIdDtoParam, // 🌟 ใช้ DTO จากไฟล์ Command / Query
    @Body() body: UpdateOrganizationByIdDtoBody, // 🌟 ใช้ DTO จากไฟล์ Command / Query
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<
      UpdateOrganizationByIdCommand,
      UpdateOrganizationByIdResponse
    >(new UpdateOrganizationByIdCommand(clerkUser.sub, param, body));
  }
}
