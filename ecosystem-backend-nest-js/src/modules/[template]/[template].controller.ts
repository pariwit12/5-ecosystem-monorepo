// ไม่ควรใช้เวลาสร้าง Template นานเกินไป เราควรทำไว้แค่ที่ตัวเองใช้และให้รัดกุมพอ แต่ว่าไม่จำเป็นต้องทำไว้เผื่อทุกกรณีที่อาจจะเจอในอนาคต
// เราจะใช้วิธี "เมื่อเจอแล้ว ค่อยสร้างเป็น Template"
// และโค้ดที่ใช้เขียนซ้ำเกิน 3 ครั้งเท่านั้น ถึงจะควรทำ Template ไว้ ถ้าใช้แค่ 1-2 ครั้ง ไม่ควรทำ

import {
  Controller,
  UseGuards,
  Get,
  Post,
  // Request,
  Body,
  // Param,
  // ParseUUIDPipe,
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
  // eslint-disable-next-line
  ClerkUser,
  // eslint-disable-next-line
  type ClerkUserData,
} from '../../common/guards/clerk-user.decorator';

import { RequireContext } from '../../common/guards/smart-context/require-context.decorator'; // รับ level ไปใช้ใน SmartContextGuard
import {
  SmartContextGuard,
  // eslint-disable-next-line
  type RequestFromSmartContextGuardPERSON,
  // eslint-disable-next-line
  type RequestFromSmartContextGuardORGANIZATION,
} from '../../common/guards/smart-context/smart-context.guard';
import {
  SmartContextPERSON,
  type SmartContextDataPERSON,
  SmartContextORGANIZATION,
  type SmartContextDataORGANIZATION,
} from '../../common/guards/smart-context/smart-context.decorator';

import {
  GetTemplateQuery,
  GetTemplateResponse,
} from './queries/get-[template].query';
import {
  MethodTemplateCommand,
  MethodTemplateResponse,
  MethodTemplateDtoBody,
} from './commands/method-[template].command';

@Controller('api/template-with-template_id-data_2-data_3')
export class TemplateController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ==========================================
  // [POST] Business Logic
  // ==========================================

  @Post(':param1_id/:param2_id') // ปรับให้ตรงตามที่ใช้จริง
  // ปรับให้ตรงตามที่ใช้จริง
  @RequireContext('PERSON') // กำหนดระดับความปลอดภัยสำหรับใช้ใน SmartContextGuard
  @UseGuards(ClerkAuthGuard, SmartContextGuard) // ปรับให้ตรงตามที่ใช้จริง (ซ้ายทำงานก่อน)
  async methodTemplate(
    // หมวด Request จาก Guards และ Decorators ที่เราสร้างขึ้นมาเอง เพื่อดึงข้อมูลที่ Guard ตรวจสอบและฝังไว้ให้มาใช้ได้เลย
    // @Request() req: RequestBeforeClerkAuthGuard, // กรณีอยากใช้ Request แบบดิบๆ ยังไม่ผ่าน ClerkAuthGuard
    // @Request() req: RequestFromClerkAuthGuard,
    // @ClerkUser() clerkUser: ClerkUserData, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูล user จาก ClerkAuthGuard มาใช้ได้เลย
    // @Request() req: RequestFromSmartContextGuardPERSON,
    // @Request() req: RequestFromSmartContextGuardORGANIZATION,
    @SmartContextPERSON() smartContext: SmartContextDataPERSON, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูลจาก SmartContextGuard มาใช้ได้เลย
    // @SmartContextORGANIZATION() smartContext: SmartContextDataORGANIZATION, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูลจาก SmartContextGuard มาใช้ได้เลย

    // ----------------------------------------------------------------------------------------------------------
    // โปรเจกต์ของเราจะไม่ใช้ @Param แล้ว เนื่องจากจะให้ Guard เป็นคนดึงข้อมูลและตรวจสอบประเภทข้อมูลก่อนส่งมาให้ใช้ต่อใน Payload เลย
    // ----------------------------------------------------------------------------------------------------------
    // สำหรับ Param เราจะตรวจประเภทข้อมูลใน Guard อยู่แล้ว จึงไม่ต้องตรวจที่นี่แล้ว
    // @Param('id') id: string,
    // สำหรับ Param เราจะตรวจประเภทข้อมูลที่นี่เลย ไม่ต้องไปสร้าง DTO + class-validator แยก
    // @Param(
    //   'id',
    //   new ParseUUIDPipe({
    //     version: '7',
    //     exceptionFactory: () =>
    //       new BadRequestException('รูปแบบรหัสคลินิก (clinic_id) ไม่ถูกต้อง'),
    //   }),
    // )
    // id: string,

    @Body() dto: MethodTemplateDtoBody, // 🌟 ใช้ DTO ที่เราสร้างไว้ในไฟล์ Command
  ) {
    // const clerkId = req.user.sub; // กรณีอยากดึง clerkId จาก Request ที่ผ่าน ClerkAuthGuard แล้ว

    return this.commandBus.execute<
      MethodTemplateCommand,
      MethodTemplateResponse
    >(
      new MethodTemplateCommand(
        dto,
        smartContext.clerkId,
        smartContext.personId,
      ),
    );
  }

  // ==========================================
  // [GET] Business Logic
  // ==========================================

  // ในโลกของ NestJS และ TypeScript การเรียงลำดับ Decorator ที่อยู่ "บนหัวฟังก์ชัน" (Method Decorators) จะสลับบรรทัดกันอย่างไร ตัวระบบก็ไม่พังครับ
  // มันจะเก็บข้อมูลเข้ากระเป๋าไปจัดลำดับการทำงาน (Lifecycle) ของมันเองอยู่ดีครับ
  @Get(':param1_id/:param2_id') // ปรับให้ตรงตามที่ใช้จริง
  // ปรับให้ตรงตามที่ใช้จริง
  @RequireContext('ORGANIZATION') // กำหนดระดับความปลอดภัยสำหรับใช้ใน SmartContextGuard
  @UseGuards(ClerkAuthGuard, SmartContextGuard) // ปรับให้ตรงตามที่ใช้จริง (ซ้ายทำงานก่อน)
  async getTemplate(
    // หมวด Request จาก Guards และ Decorators ที่เราสร้างขึ้นมาเอง เพื่อดึงข้อมูลที่ Guard ตรวจสอบและฝังไว้ให้มาใช้ได้เลย
    // @Request() req: RequestBeforeClerkAuthGuard, // กรณีอยากใช้ Request แบบดิบๆ ยังไม่ผ่าน ClerkAuthGuard
    // @Request() req: RequestFromClerkAuthGuard,
    // @ClerkUser() clerkUser: ClerkUserData, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูล user จาก ClerkAuthGuard มาใช้ได้เลย
    // @Request() req: RequestFromSmartContextGuardPERSON,
    // @Request() req: RequestFromSmartContextGuardORGANIZATION,
    // @SmartContextPERSON() smartContext: SmartContextDataPERSON, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูลจาก SmartContextGuard มาใช้ได้เลย
    @SmartContextORGANIZATION() smartContext: SmartContextDataORGANIZATION, // 🌟 ใช้ Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูลจาก SmartContextGuard มาใช้ได้เลย

    // ----------------------------------------------------------------------------------------------------------
    // โปรเจกต์ของเราจะไม่ใช้ @Param แล้ว เนื่องจากจะให้ Guard เป็นคนดึงข้อมูลและตรวจสอบประเภทข้อมูลก่อนส่งมาให้ใช้ต่อใน Payload เลย
    // ----------------------------------------------------------------------------------------------------------
    // สำหรับ Param เราจะตรวจประเภทข้อมูลใน Guard อยู่แล้ว จึงไม่ต้องตรวจที่นี่แล้ว
    // @Param('id') id: string,
    // สำหรับ Param เราจะตรวจประเภทข้อมูลที่นี่เลย ไม่ต้องไปสร้าง DTO + class-validator แยก
    // @Param(
    //   'id',
    //   new ParseUUIDPipe({
    //     version: '7',
    //     exceptionFactory: () =>
    //       new BadRequestException('รูปแบบรหัสคลินิก (clinic_id) ไม่ถูกต้อง'),
    //   }),
    // )
    // id: string,
  ) {
    // const clerkId = req.user.sub; // กรณีอยากดึง clerkId จาก Request ที่ผ่าน ClerkAuthGuard แล้ว

    // 🌟 สร้างใบสั่งงานแล้วโยนเข้า Bus เลย
    // execute< [ตัวที่ 1: ขาเข้า], [ตัวที่ 2: ขาออก] >( ข้อมูลที่ใส่เข้าไปจริงๆ )
    return this.queryBus.execute<GetTemplateQuery, GetTemplateResponse>(
      new GetTemplateQuery(
        smartContext.clerkId,
        smartContext.personId,
        smartContext.personOrganizationAffiliationId,
        smartContext.organizationId,
      ),
    );
  }
}
