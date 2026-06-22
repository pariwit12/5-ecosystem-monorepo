import { Controller, UseGuards, Get } from '@nestjs/common';
import {
  QueryBus,
  // CommandBus
} from '@nestjs/cqrs';

import { ClerkAuthGuard } from '../../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../../common/guards/clerk-user.decorator';

// import {
//   MethodTemplateCommand,
//   MethodTemplateResponse,
//   MethodTemplateDtoParam, // ห้ามใส่ type ทั่วไป ไม่งั้น zod จะไม่ทำงาน (ต้องสร้างจาก zod - createZodDto)
//   MethodTemplateDtoBody, // ห้ามใส่ type ทั่วไป ไม่งั้น zod จะไม่ทำงาน (ต้องสร้างจาก zod - createZodDto)
// } from './commands/method-[template].command';
import {
  GetUserRolesByClerkIdQuery,
  GetUserRolesByClerkIdResponse,
} from './queries/get-user-roles-by-clerk-id.query';

@Controller('api/work-schedule/log-in')
export class WorkScheduleLogInController {
  constructor(
    private readonly queryBus: QueryBus,
    // private readonly commandBus: CommandBus,
  ) {}

  // ==========================================
  // [GET] Business Logic
  // ==========================================
  @Get()
  @UseGuards(ClerkAuthGuard)
  async getTemplate(
    @ClerkUser() clerkUser: ClerkUserData, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูล user จาก ClerkAuthGuard มาใช้ได้เลย
  ) {
    return this.queryBus.execute<
      GetUserRolesByClerkIdQuery,
      GetUserRolesByClerkIdResponse
    >(new GetUserRolesByClerkIdQuery(clerkUser.sub));
  }
}
