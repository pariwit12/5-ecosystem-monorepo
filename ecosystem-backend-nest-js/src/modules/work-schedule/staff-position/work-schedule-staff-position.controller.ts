import {
  Controller,
  UseGuards,
  Get,
  Post,
  Param,
  Body,
  Request,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';

// =================================
// Import Guard and Decoration
// =================================

import {
  //
  // ปรับตามใช้งานจริง
  // eslint-disable-next-line
  type RequestBeforeClerkAuthGuard, // ใช้แทน Request จาก Express เพื่อป้องกันการ import แล้วชนกับ Request จาก @nestjs/common ที่เป็น ตัวฟังก์ชัน
  ClerkAuthGuard,
  // eslint-disable-next-line
  type RequestFromClerkAuthGuard,
  //
} from '../../../common/guards/clerk-auth.guard';
import {
  //
  // ปรับตามใช้งานจริง
  ClerkUser,
  type ClerkUserData,
  //
} from '../../../common/guards/clerk-user.decorator';

// =================================
// (จบ) Import Guard and Decoration
// =================================

// ===========================
// Import Type (Command)
// ===========================

import {
  //
  // ปรับตามใช้งานจริง
  MethodTemplateCommand, // ปรับตามใช้งานจริง
  MethodTemplateResponse, // ปรับตามใช้งานจริง
  MethodTemplateDtoParam, // ปรับตามใช้งานจริง
  MethodTemplateDtoBody, // ปรับตามใช้งานจริง

  // ปรับตามใช้งานจริง
} from './commands/method-[template].command';

// ===========================
// (จบ) Import Type (Command)
// ===========================

// =========================
// Import Type (Query)
// =========================

import {
  GetWorkScheduleStaffPositionsByPositionIdQuery,
  GetWorkScheduleStaffPositionsByPositionIdResponse,
  GetWorkScheduleStaffPositionsByPositionIdDtoParam,
} from './queries/get-work-schedule-staff-positions-by-position-id.query';

// =========================
// (จบ) Import Type (Query)
// =========================

@Controller('api/work-schedule/staff-position')
export class WorkScheduleStaffPositionController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ========================================================================================
  // Method
  // ========================================================================================

  // ==========================================
  // [POST] Business Logic
  // ==========================================

  // ==========================================
  // [PATCH] Business Logic
  // ==========================================

  // ในโลกของ NestJS และ TypeScript การเรียงลำดับ Decorator ที่อยู่ "บนหัวฟังก์ชัน" (Method Decorators) จะสลับบรรทัดกันอย่างไร ตัวระบบก็ไม่พังครับ
  // มันจะเก็บข้อมูลเข้ากระเป๋าไปจัดลำดับการทำงาน (Lifecycle) ของมันเองอยู่ดีครับ

  // ปรับตามใช้งานจริง
  @Post(':param1_id/:param2_id') // ปรับให้ตรงตามที่ใช้จริง

  // ปรับให้ตรงตามที่ใช้จริง
  @UseGuards(ClerkAuthGuard) // ปรับให้ตรงตามที่ใช้จริง (ซ้ายทำงานก่อน)

  // ปรับตามใช้งานจริง
  async methodTemplate(
    //
    // ตรวจข้อมูลตามลำดับ (ซ้ายไปขวา, บนลงล่าง) ดังนั้นให้ไล่เป็น @Param (เบาสุด), @Query, @Body (หนักสุด), @ClerkUser (และอื่นๆ ที่ไม่ต้องตรวจ)

    // ปรับตามใช้งานจริง
    @Param() param: MethodTemplateDtoParam, // ปรับตามใช้งานจริง
    @Body() body: MethodTemplateDtoBody, // ปรับตามใช้งานจริง

    // หมวด Request จาก Guards และ Decorators ที่เราสร้างขึ้นมาเอง เพื่อดึงข้อมูลที่ Guard ตรวจสอบและฝังไว้ให้มาใช้ได้เลย

    // ปรับตามใช้งานจริง
    // @Request() req: RequestBeforeClerkAuthGuard, // ใช้ในกรณีอยากใช้ Request แบบดิบๆ ที่ยังไม่ผ่าน ClerkAuthGuard
    // @Request() req: RequestFromClerkAuthGuard,
    @ClerkUser() clerkUser: ClerkUserData, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูล user จาก ClerkAuthGuard
    //
  ) {
    return this.commandBus.execute<
      //
      // ปรับตามใช้งานจริง
      MethodTemplateCommand, // ปรับตามใช้งานจริง
      //
      // หากไม่มีการคืนค่า ให้ใส่ void แทน MethodTemplateResponse
      MethodTemplateResponse // ปรับตามใช้งานจริง
      //
    >(
      // ปรับตามใช้งานจริง
      new MethodTemplateCommand(
        //
        // ปรับตามใช้งานจริง
        clerkUser.sub,
        param,
        body,
      ),
    );
  }

  // ========================================================================================
  // (จบ) Method
  // ========================================================================================

  // ========================================================================================
  // Query
  // ========================================================================================

  // ==========================================
  // [GET] Business Logic
  // ==========================================

  @Get('by-position-id/:work_schedule_position_id')
  @UseGuards(ClerkAuthGuard)
  async getWorkScheduleStaffPositionsByPositionId(
    @Param() param: GetWorkScheduleStaffPositionsByPositionIdDtoParam,
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      GetWorkScheduleStaffPositionsByPositionIdQuery,
      GetWorkScheduleStaffPositionsByPositionIdResponse
    >(new GetWorkScheduleStaffPositionsByPositionIdQuery(clerkUser.sub, param));
  }

  // ========================================================================================
  // (จบ) Query
  // ========================================================================================
  //
}
