// ไม่ควรใช้เวลาสร้าง Template นานเกินไป เราควรทำไว้แค่ที่ตัวเองใช้และให้รัดกุมพอ แต่ว่าไม่จำเป็นต้องทำไว้เผื่อทุกกรณีที่อาจจะเจอในอนาคต
// เราจะใช้วิธี "เมื่อเจอแล้ว ค่อยสร้างเป็น Template"
// และโค้ดที่ใช้เขียนซ้ำเกิน 3 ครั้งเท่านั้น ถึงจะควรทำ Template ไว้ ถ้าใช้แค่ 1-2 ครั้ง ไม่ควรทำ

import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  // Request,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';

import {
  // eslint-disable-next-line
  type RequestBeforeClerkAuthGuard, // ใช้แทน Request จาก Express เพื่อป้องกันการ import แล้วชนกับ Request จาก @nestjs/common ที่เป็น ตัวฟังก์ชัน
  ClerkAuthGuard,
  // eslint-disable-next-line
  type RequestFromClerkAuthGuard,
} from '../../common/guards/clerk-auth.guard';
import {
  ClerkUser,
  type ClerkUserData,
} from '../../common/guards/clerk-user.decorator';

import {
  MethodTemplateCommand,
  MethodTemplateResponse,
  MethodTemplateDtoParam, // ห้ามใส่ type ทั่วไป ไม่งั้น zod จะไม่ทำงาน (ต้องสร้างจาก zod - createZodDto)
  MethodTemplateDtoBody, // ห้ามใส่ type ทั่วไป ไม่งั้น zod จะไม่ทำงาน (ต้องสร้างจาก zod - createZodDto)
} from './commands/method-[template].command';
import {
  GetTemplateQuery,
  GetTemplateResponse,
  GetTemplateDtoParam, // ห้ามใส่ type ทั่วไป ไม่งั้น zod จะไม่ทำงาน (ต้องสร้างจาก zod - createZodDto)
  GetTemplateDtoQuery, // ห้ามใส่ type ทั่วไป ไม่งั้น zod จะไม่ทำงาน (ต้องสร้างจาก zod - createZodDto)
} from './queries/get-[template].query';

@Controller('api/template(Business Logic)')
export class TemplateController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ==========================================
  // [POST] Business Logic
  // ==========================================

  // ==========================================
  // [PATCH] Business Logic
  // ==========================================

  @Post(':param1_id/:param2_id') // ปรับให้ตรงตามที่ใช้จริง
  @Patch(':param1_id/:param2_id') // ปรับให้ตรงตามที่ใช้จริง
  // ปรับให้ตรงตามที่ใช้จริง
  @UseGuards(ClerkAuthGuard) // ปรับให้ตรงตามที่ใช้จริง (ซ้ายทำงานก่อน)
  async methodTemplate(
    // ตรวจข้อมูลตามลำดับ (ซ้ายไปขวา, บนลงล่าง) ดังนั้นให้ไล่เป็น @Param (เบาสุด), @Query, @Body (หนักสุด), @ClerkUser (และอื่นๆ ที่ไม่ต้องตรวจ)
    @Param() param: MethodTemplateDtoParam, // 🌟 ใช้ DTO จากไฟล์ Command / Query
    @Body() body: MethodTemplateDtoBody, // 🌟 ใช้ DTO จากไฟล์ Command / Query

    // หมวด Request จาก Guards และ Decorators ที่เราสร้างขึ้นมาเอง เพื่อดึงข้อมูลที่ Guard ตรวจสอบและฝังไว้ให้มาใช้ได้เลย
    // @Request() req: RequestBeforeClerkAuthGuard, // กรณีอยากใช้ Request แบบดิบๆ ยังไม่ผ่าน ClerkAuthGuard
    // @Request() req: RequestFromClerkAuthGuard,
    @ClerkUser() clerkUser: ClerkUserData, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูล user จาก ClerkAuthGuard มาใช้ได้เลย
  ) {
    return this.commandBus.execute<
      MethodTemplateCommand,
      MethodTemplateResponse // หากไม่มีการคืนค่า ให้ใส่ void แทน MethodTemplateResponse
    >(new MethodTemplateCommand(clerkUser.sub, param, body));
  }

  // ==========================================
  // [GET] Business Logic
  // ==========================================

  // ในโลกของ NestJS และ TypeScript การเรียงลำดับ Decorator ที่อยู่ "บนหัวฟังก์ชัน" (Method Decorators) จะสลับบรรทัดกันอย่างไร ตัวระบบก็ไม่พังครับ
  // มันจะเก็บข้อมูลเข้ากระเป๋าไปจัดลำดับการทำงาน (Lifecycle) ของมันเองอยู่ดีครับ
  @Get(':param1_id/:param2_id') // ปรับให้ตรงตามที่ใช้จริง
  // ปรับให้ตรงตามที่ใช้จริง
  @UseGuards(ClerkAuthGuard) // ปรับให้ตรงตามที่ใช้จริง (ซ้ายทำงานก่อน)
  async getTemplate(
    // ตรวจข้อมูลตามลำดับ (ซ้ายไปขวา, บนลงล่าง) ดังนั้นให้ไล่เป็น @Param (เบาสุด), @Query, @Body (หนักสุด), @ClerkUser (และอื่นๆ ที่ไม่ต้องตรวจ)
    @Param() param: GetTemplateDtoParam, // 🌟 ใช้ DTO จากไฟล์ Command / Query
    @Query() queryFromUrl: GetTemplateDtoQuery, // 🌟 ใช้ DTO จากไฟล์ Command / Query

    // หมวด Request จาก Guards และ Decorators ที่เราสร้างขึ้นมาเอง เพื่อดึงข้อมูลที่ Guard ตรวจสอบและฝังไว้ให้มาใช้ได้เลย
    // @Request() req: RequestBeforeClerkAuthGuard, // กรณีอยากใช้ Request แบบดิบๆ ยังไม่ผ่าน ClerkAuthGuard
    // @Request() req: RequestFromClerkAuthGuard,
    @ClerkUser() clerkUser: ClerkUserData, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูล user จาก ClerkAuthGuard มาใช้ได้เลย
  ) {
    return this.queryBus.execute<GetTemplateQuery, GetTemplateResponse>(
      new GetTemplateQuery(clerkUser.sub, param, queryFromUrl),
    );
  }
}

// อย่าลืมไปลงทะเบียน ใน [template].module.ts
