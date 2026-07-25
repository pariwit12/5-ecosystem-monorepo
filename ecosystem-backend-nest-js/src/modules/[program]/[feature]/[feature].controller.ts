import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Request,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';

// ==>>==>>== Import Guard and Decoration ==<<==<<==

import {
  // ปรับตามใช้งานจริง

  // eslint-disable-next-line
  type RequestBeforeClerkAuthGuard, // ใช้แทน Request จาก Express เพื่อป้องกันการ import แล้วชนกับ Request จาก @nestjs/common ที่เป็น ตัวฟังก์ชัน
  ClerkAuthGuard,
  // eslint-disable-next-line
  type RequestFromClerkAuthGuard,
} from '../../../common/guards/clerk-auth.guard';
import {
  // ปรับตามใช้งานจริง
  ClerkUser,
  type ClerkUserData,
} from '../../../common/guards/clerk-user.decorator';

// ==>>==>>== (จบ) Import Guard and Decoration ==<<==<<==

// ==========================
// Import Type (Command)
// ==========================

import {
  // ปรับตามใช้งานจริง
  MethodManyAvailableOtherProgramOtherFeatureCommand,
  MethodManyAvailableOtherProgramOtherFeatureResponse,
  MethodManyAvailableOtherProgramOtherFeatureDtoParam,
  MethodManyAvailableOtherProgramOtherFeatureDtoBody,

  // ปรับตามใช้งานจริง
} from './commands/[method-many]-[available_null]-[other-program_null]-[other-feature_null].command';

// ==========================
// (จบ) Import Type (Command)
// ==========================

// ========================
// Import Type (Query)
// ========================

import {
  // ปรับตามใช้งานจริง
  GetAvailableOtherProgramFeaturesQuery,
  GetAvailableOtherProgramFeaturesResponse,
  GetAvailableOtherProgramFeaturesDtoParam,
  GetAvailableOtherProgramFeaturesDtoQuery,

  // ปรับตามใช้งานจริง
} from './queries/get-[available_null]-[other-program_null]-[features_feature].query';

// ========================
// (จบ) Import Type (Query)
// ========================

@Controller(
  'api/template', // ปรับตามใช้งานจริง
)

// ปรับตามใช้งานจริง
export class FeatureController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  // ===============================
  // ลงทะเบียน URL Path (Method)
  // ===============================

  // ปรับตามใช้งานจริง
  // 1

  // ในโลกของ NestJS และ TypeScript การเรียงลำดับ Decorator ที่อยู่ "บนหัวฟังก์ชัน" (Method Decorators) จะสลับบรรทัดกันอย่างไร ตัวระบบก็ไม่พังครับ
  // มันจะเก็บข้อมูลเข้ากระเป๋าไปจัดลำดับการทำงาน (Lifecycle) ของมันเองอยู่ดีครับ

  // ปรับตามใช้งานจริง
  @Post(':param1_id/:param2_id')
  @Patch(':param1_id/:param2_id')

  // ปรับตามใช้งานจริง (ซ้ายทำงานก่อน)
  @UseGuards(ClerkAuthGuard)

  // ปรับตามใช้งานจริง
  async methodTemplate(
    //
    // ตรวจข้อมูลตามลำดับ (ซ้ายไปขวา, บนลงล่าง)
    // ดังนั้นให้ไล่เป็น
    // @Param (เบาสุด),
    // @Query,
    // @Body (หนักสุด),
    // อื่นๆ ที่ไม่ต้องตรวจ (เช่น @ClerkUser)

    // ปรับตามใช้งานจริง

    @Param() param: MethodManyAvailableOtherProgramOtherFeatureDtoParam,
    @Body() body: MethodManyAvailableOtherProgramOtherFeatureDtoBody,

    // หน้าตา Request ที่ยังไม่ผ่าน ClerkAuthGuard
    // ใช้ในกรณีอยากใช้ Request แบบดิบๆ ที่ยังไม่ผ่าน ClerkAuthGuard
    // @Request() req: RequestBeforeClerkAuthGuard,

    // หน้าตา Request ที่ผ่าน ClerkAuthGuard แล้ว
    // @Request() req: RequestFromClerkAuthGuard,

    // Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูล user จาก ClerkAuthGuard (โดยไม่ต้องเรียกมาทั้ง request)
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.commandBus.execute<
      //
      // ปรับตามใช้งานจริง
      MethodManyAvailableOtherProgramOtherFeatureCommand,
      //
      // หากไม่มีการคืนค่า ให้ใส่ void แทน
      MethodManyAvailableOtherProgramOtherFeatureResponse
    >(
      // ปรับตามใช้งานจริง
      new MethodManyAvailableOtherProgramOtherFeatureCommand(
        //
        // ปรับตามใช้งานจริง
        clerkUser.sub,
        param,
        body,
      ),
    );
  }

  // ===============================
  // (จบ) ลงทะเบียน URL Path (Method)
  // ===============================

  // ==============================
  // ลงทะเบียน URL Path (Query)
  // ==============================

  // ปรับตามใช้งานจริง
  // 1

  // ในโลกของ NestJS และ TypeScript การเรียงลำดับ Decorator ที่อยู่ "บนหัวฟังก์ชัน" (Method Decorators) จะสลับบรรทัดกันอย่างไร ตัวระบบก็ไม่พังครับ
  // มันจะเก็บข้อมูลเข้ากระเป๋าไปจัดลำดับการทำงาน (Lifecycle) ของมันเองอยู่ดีครับ

  // ปรับตามใช้งานจริง
  @Get('by-param1-id-and-param2-id/:param1_id/:param2_id')

  // ปรับตามใช้งานจริง (ซ้ายทำงานก่อน)
  @UseGuards(ClerkAuthGuard)

  // ปรับตามใช้งานจริง
  async getTemplate(
    //
    // ตรวจข้อมูลตามลำดับ (ซ้ายไปขวา, บนลงล่าง)
    // ดังนั้นให้ไล่เป็น
    // @Param (เบาสุด),
    // @Query,
    // @Body (หนักสุด),
    // อื่นๆ ที่ไม่ต้องตรวจ (เช่น @ClerkUser)

    // ปรับตามใช้งานจริง

    @Param() param: GetAvailableOtherProgramFeaturesDtoParam,
    @Query() queryFromUrl: GetAvailableOtherProgramFeaturesDtoQuery,

    // หน้าตา Request ที่ยังไม่ผ่าน ClerkAuthGuard
    // ใช้ในกรณีอยากใช้ Request แบบดิบๆ ที่ยังไม่ผ่าน ClerkAuthGuard
    // @Request() req: RequestBeforeClerkAuthGuard,

    // หน้าตา Request ที่ผ่าน ClerkAuthGuard แล้ว
    // @Request() req: RequestFromClerkAuthGuard,

    // Decorator ที่เราสร้างขึ้นมาเพื่อดึงข้อมูล user จาก ClerkAuthGuard (โดยไม่ต้องเรียกมาทั้ง request)
    @ClerkUser() clerkUser: ClerkUserData,
  ) {
    return this.queryBus.execute<
      //
      // ปรับตามใช้งานจริง
      GetAvailableOtherProgramFeaturesQuery,
      GetAvailableOtherProgramFeaturesResponse
    >(
      // ปรับตามใช้งานจริง
      new GetAvailableOtherProgramFeaturesQuery(
        //
        // ปรับตามใช้งานจริง
        clerkUser.sub,
        param,
        queryFromUrl,
      ),
    );
  }

  // ==============================
  // (จบ) ลงทะเบียน URL Path (Query)
  // ==============================
}

// อย่าลืมไปลงทะเบียน ใน Module
