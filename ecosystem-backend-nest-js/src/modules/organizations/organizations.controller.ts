import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';

import { RequireContext } from '../../common/guards/smart-context/require-context.decorator'; // รับ level ไปใช้ใน SmartContextGuard
import { SmartContextGuard } from '../../common/guards/smart-context/smart-context.guard';
import {
  SmartContextPERSON,
  type SmartContextDataPERSON,
  SmartContextORGANIZATION,
  type SmartContextDataORGANIZATION,
} from '../../common/guards/smart-context/smart-context.decorator';

import {
  GetOrganizationsQuery,
  GetOrganizationsResponse,
} from './queries/get-organizations.query';
import {
  GetOrganizationByIdQuery,
  GetOrganizationByIdResponse,
} from './queries/get-organization-by-id.query';
import {
  CreateOrganizationCommand,
  CreateOrganizationResponse,
  CreateOrganizationDtoBody,
} from './commands/create-organization.command';

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
  @RequireContext('PERSON')
  @UseGuards(ClerkAuthGuard, SmartContextGuard)
  async getOrganizations(
    @SmartContextPERSON() smartContext: SmartContextDataPERSON,
  ) {
    return this.queryBus.execute<
      GetOrganizationsQuery,
      GetOrganizationsResponse
    >(new GetOrganizationsQuery(smartContext.clerkId, smartContext.personId));
  }

  // ==========================================
  // [POST] สร้างคลินิกใหม่ + ผูกสิทธิ์ให้ผู้สร้างทันที
  // ==========================================

  @Post()
  @RequireContext('PERSON')
  @UseGuards(ClerkAuthGuard, SmartContextGuard)
  async createOrganization(
    @SmartContextPERSON() smartContext: SmartContextDataPERSON,
    @Body() dto: CreateOrganizationDtoBody, // 🌟 ใช้ DTO ที่เราสร้างไว้ในไฟล์ Command
  ) {
    // แพ็กของใส่ Command แล้วโยนลง Bus
    return this.commandBus.execute<
      CreateOrganizationCommand,
      CreateOrganizationResponse
    >(
      new CreateOrganizationCommand(
        dto,
        smartContext.clerkId,
        smartContext.personId,
      ),
    );
  }

  // ==========================================
  // [GET] ดึงข้อมูลองค์กรโดย ID (สำหรับหน้า Settings ขององค์กรที่เลือก = หน้าต่าง organizations/settings)
  // ==========================================

  @Get(':organization_id')
  @RequireContext('ORGANIZATION')
  @UseGuards(ClerkAuthGuard, SmartContextGuard)
  async getOrganizationById(
    @SmartContextORGANIZATION() smartContext: SmartContextDataORGANIZATION,
  ) {
    return this.queryBus.execute<
      GetOrganizationByIdQuery,
      GetOrganizationByIdResponse
    >(
      new GetOrganizationByIdQuery(
        smartContext.clerkId,
        smartContext.personId,
        smartContext.personOrganizationAffiliationId,
        smartContext.organizationId,
      ),
    );
  }
}
