import {
  Injectable,
  CanActivate,
  ExecutionContext,
  // UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { Request } from 'express'; // 👈 นำเข้า Request type จาก express
import { REQUIRE_CONTEXT_KEY, ContextLevel } from './require-context.decorator';

import { isUUID } from 'class-validator'; // 🌟 เรียกใช้ในร่าง Function ธรรมดา

// ----------------------------------------
// 🌟 สร้าง Interface อธิบายหน้าตาของ Request

// 📥 ขาเข้า: ตอนเพิ่งเริ่มเข้า Guard (ทุกอย่างเป็น Optional)
export interface RequestBeforeSmartContextGuard extends Request {
  // user จาก ClerkAuthGuard
  user: {
    // ข้อมูลที่ ClerkAuthGuard เพิ่มเข้ามาใน Request ไว้แล้ว ก่อนที่จะมาเข้า SmartContextGuard
    // 🌟 ใส่เฉพาะสิ่งที่เรามั่นใจว่า Clerk ส่งมาแน่ๆ และเราต้องใช้
    sub: string;

    // (อนาคตถ้าต้องใช้ฟิลด์อื่น ค่อยมาเติมตรงนี้ เช่น exp?: number)
  };
  // ใส่ของ clerk-auth ไว้ด้วย เพราะต้องผ่าน ClerkAuthGuard มาก่อนถึงจะมาถึง SmartContextGuard ได้

  smartContextGuard?: any; // เตรียมเผื่อไว้สำหรับข้อมูลที่จะเพิ่มไปใน Request โดย SmartContextGuard
}

// 📤 ขาออก: ตอนส่งให้ Controller (รับประกันว่ามีข้อมูลแน่นอน ไม่มีเครื่องหมาย ?)
export interface RequestFromSmartContextGuardPERSON extends Request {
  user: { sub: string };
  smartContextGuard: {
    clerkId: string;
    personId: string;
  };
}

export interface RequestFromSmartContextGuardORGANIZATION extends Request {
  user: { sub: string };
  smartContextGuard: {
    clerkId: string;
    personId: string;
    personOrganizationAffiliationId: string;
    organizationId: string;
  };
}

@Injectable()
export class SmartContextGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. ส่องดูป้ายว่า API เส้นนี้ต้องการความปลอดภัยระดับไหน จาก @RequireContext() ที่แปะไว้บน Controller หรือ Method นั้นๆ
    const requiredLevel = this.reflector.getAllAndOverride<ContextLevel>(
      REQUIRE_CONTEXT_KEY,
      [context.getHandler(), context.getClass()],
      // context.getClass() (ระดับคลาส / Controller)
      // มันคือการส่องดูว่า บนหัวของไฟล์ Controller ทั้งก้อน มีป้าย @RequireContext() แปะอยู่ไหม?
      // ประโยชน์: เอาไว้ตั้งค่าพื้นฐาน (Default) ให้กับ API ทุกเส้น ใน Controller นั้น จะได้ไม่ต้องเหนื่อยแปะป้ายซ้ำๆ ทุกฟังก์ชันครับ

      // context.getHandler() (ระดับเมธอด / Function)
      // มันคือการส่องดูว่า บนหัวของ API เส้นนั้นๆ (เช่น @Get(), @Post()) มีป้ายแปะอยู่หรือเปล่า?
      // ประโยชน์: เอาไว้กำหนดสิทธิ์เฉพาะกิจให้กับ API บางเส้น ที่อาจจะต้องการความปลอดภัยสูงกว่าเส้นอื่นๆ

      // คำสั่ง getAllAndOverride แปลตรงตัวคือ "หามาให้หมด แล้วเอาอันที่ชนะมาทับซ้อนกัน" ครับ
      // การที่เราใส่ Array เป็น [context.getHandler(), context.getClass()] เรียงลำดับแบบนี้ เป็นการบอก NestJS (แว่นขยาย) ว่า:
      // 👉 "ให้ไปดูป้ายที่หน้าประตูห้อง (getHandler) ก่อนนะ... ถ้ามีป้าย ก็เอาอันนี้แหละ ชนะเลิศ!"
      // 👉 "แต่ถ้าหน้าประตูห้องไม่มีป้าย... ให้ถอยออกมาดูป้ายที่หน้าตึก (getClass) แทน"
    );

    // 🛑 1. กฎเหล็ก: "ห้ามลืมแปะป้ายเด็ดขาด!" ถ้าลืม = throw error + console.error
    if (!requiredLevel) {
      console.error(
        `\n❌ [Developer Error][SmartContextGuard]: Missing @RequireContext()!\n` +
          `👉 API เส้นนี้มีการเรียกใช้ SmartContextGuard แต่คุณไม่ได้แปะป้าย @RequireContext() กำกับไว้\n` +
          `📌 กรุณาแปะป้ายเพื่อระบุระดับสิทธิ์ หรือถ้าไม่ต้องการใช้บริบทคลินิก ให้ลบ SmartContextGuard ออกจาก guards ของ API เส้นนี้\n`,
      );

      // โยน 500 ให้ระบบพังไปเลย Developer จะได้รู้ตัวและรีบแก้ก่อนขึ้น Production
      throw new InternalServerErrorException(
        'Server Configuration Error: Missing Context Level Specification',
      );
    }
    // ถ้าตรวจสอบดีแล้วว่าไม่มี บั๊กจาก Developer ชัวร์ๆ อาจ comment ทิ้งได้ แต่คิดว่าเก็บไว้ยาวๆดีกว่า

    const request = context
      .switchToHttp()
      .getRequest<RequestBeforeSmartContextGuard>();

    const clerkId = request.user?.sub;

    // ปกติตรงนี้ไม่ต้องตรวจ clerkId แล้ว เพราะว่าต้องผ่าน ClerkAuthGuard มาแล้ว
    // แต่ควรใส่ไว้เพื่อดัก Developer อาจจะเขียนโค้ดผิดพลาด เช่น ลืมใส่ ClerkAuthGuard แต่ดันเรียก SmartContextGuard เลย เป็นต้น
    if (!clerkId) {
      // 🔊 1. ตะโกนบอกใน Terminal หลังบ้านให้เสียงดังและชัดเจนที่สุด (ใส่ Emoji ให้สะดุดตา)
      console.error(
        `\n❌ [Developer Error][SmartContextGuard]: 'request.user' is undefined!\n` +
          `👉 เหตุการณ์นี้มักเกิดจาก: คุณลืมแปะ @UseGuards(ClerkAuthGuard) ไว้ข้างหน้า SmartContextGuard หรือเปล่า?\n` +
          `📌 กรุณาตรวจสอบที่ Controller ของ API เส้นนี้ด่วนครับ!\n`,
      );

      // 🛑 2. Throw เป็น InternalServerErrorException (500)
      // เหตุผล: เพราะนี่คือ "ระบบหลังบ้านพัง/เซ็ตค่าผิด" ไม่ใช่ User ลืมล็อกอิน
      // การพ่น 500 พร้อมข้อความใบ้ จะช่วยให้ทีม QA หรือ Frontend ถ่ายรูปส่งมาแจ้งเบาะแสหลังบ้านได้ง่ายขึ้นครับ
      throw new InternalServerErrorException(
        'Server Configuration Error: กรุณาติดต่อฝ่ายพัฒนาเพื่อให้ดำเนินการตรวจสอบ',
      );
    }
    // ถ้าตรวจสอบดีแล้วว่าไม่มี บั๊กจาก Developer ชัวร์ๆ อาจ comment ทิ้งได้ แต่คิดว่าเก็บไว้ยาวๆดีกว่า

    switch (requiredLevel) {
      case 'PERSON': {
        const person = await this.prisma.person.findUnique({
          where: { clerkId: clerkId },
          select: { id: true }, // Select แค่ ID เพื่อรีดประสิทธิภาพให้ไวที่สุด
        });

        // ถ้าไม่มี Person ปา Error พร้อมรหัสโค้ดให้ Frontend เอาไปเล่นต่อ
        if (!person) {
          // รอเปลี่ยนในอนาคต ถ้า Business Logic เปลี่ยน
          throw new ForbiddenException({
            errorCode: 'PERSON_NOT_FOUND',
            message:
              'ไม่พบข้อมูลโปรไฟล์ผู้ใช้งานในระบบ กรุณาลงทะเบียนโปรไฟล์ก่อนเข้าใช้งาน',
          });
        }

        // ถ้ามีข้อมูล ก็ยัดลง Payload ส่งต่อให้ Controller ไปใช้งาน
        request.smartContextGuard = {
          clerkId: clerkId,
          personId: person.id,
        };

        break; // ผ่านด่าน PERSON สำเร็จ!
      }

      case 'ORGANIZATION': {
        // 💡 สมมติว่ารับค่าจาก url ผ่าน params
        const reqOrgId = request.params.organization_id as string;

        if (!reqOrgId) {
          throw new BadRequestException(
            'จำเป็นต้องระบุรหัสองค์กร (organization_id) ใน URL',
          );
        }

        // ตรวจสอบประเภทของข้อมูลตรงนี้
        if (!isUUID(reqOrgId, '7')) {
          throw new BadRequestException(
            'รูปแบบรหัสองค์กรไม่ถูกต้อง (ต้องเป็น UUIDv7)',
          );
        }

        // ยิง Query เดียว หา Person และกรอง Affiliation ที่ตรงกับ organization_id จาก URL ทันที
        const person = await this.prisma.person.findUnique({
          where: { clerkId: clerkId },
          select: {
            id: true,
            personOrganizationAffiliations: {
              where: {
                organizationId: reqOrgId,
              },
              select: {
                id: true,
                organization: {
                  select: {
                    id: true,
                    deletedAt: true,
                  },
                },
              },
            },
          },
        });

        // 3. ตรวจสอบด่านที่ 1: มีตัวตนในระบบไหม?
        if (!person) {
          throw new ForbiddenException({
            errorCode: 'PERSON_NOT_FOUND',
            message: 'ไม่พบข้อมูลโปรไฟล์ กรุณาลงทะเบียนโปรไฟล์ก่อนเข้าใช้งาน',
          });
        }

        // 4. ตรวจสอบด่านที่ 2: มีความสัมพันธ์กับ Organization นี้ไหม?
        if (
          !person.personOrganizationAffiliations ||
          person.personOrganizationAffiliations.length === 0
        ) {
          throw new ForbiddenException({
            errorCode: 'NOT_ORGANIZATION_MEMBER',
            message: 'คุณไม่มีสิทธิ์เข้าถึง หรือไม่ได้เป็นสมาชิกขององค์กรนี้',
          });
        }

        if (
          person.personOrganizationAffiliations[0].organization.deletedAt !==
          null
        ) {
          throw new ForbiddenException({
            errorCode: 'ORGANIZATION_DELETED',
            message: 'องค์กรนี้ถูกลบออกจากระบบแล้ว',
          });
        }

        // ผ่านฉลุย! ยัดลง Payload ส่งให้ Controller ทำงานต่อ
        request.smartContextGuard = {
          clerkId: clerkId,
          personId: person.id,
          personOrganizationAffiliationId:
            person.personOrganizationAffiliations[0].id,
          organizationId: reqOrgId,
        };

        break;
      }
    }

    // // ==========================================
    // // 🛑 เฟส 1: Sanity Check (ดักพังก่อนเสีย DB Quota)
    // // ==========================================
    // const clinicId = request.params.clinic_id; // 💡 ดึงจาก URL Parameters

    // // ถ้าเป็นระดับที่ต้องใช้ข้อมูลคลินิก ต้องมี clinicId ที่ถูกต้องแนบมาด้วย
    // if (requiredLevel === 'CLINIC_MEMBER' || requiredLevel === 'DENTIST_ONLY') {
    //   if (!clinicId) {
    //     throw new BadRequestException(
    //       'จำเป็นต้องระบุรหัสคลินิก (clinic_id) ใน URL',
    //     );
    //   }

    //   // 🌟 ใช้ class-validator ดักจับตรงนี้!
    //   if (!isUUID(clinicId, '7')) {
    //     throw new BadRequestException(
    //       'รูปแบบรหัสคลินิกไม่ถูกต้อง (ต้องเป็น UUIDv7)',
    //     );
    //   }
    // }

    // // ==========================================
    // // ⚡ เฟส 2: Dynamic Query (ดึงข้อมูลเท่าที่จำเป็น)
    // // ==========================================
    // const includeConfig: any = {};

    // if (requiredLevel === 'CLINIC_MEMBER' || requiredLevel === 'DENTIST_ONLY') {
    //   includeConfig.personOrganizationAffiliations = {
    //     where: { organizationId: clinicId, status: 'ACTIVE' },
    //   };
    // }
    // if (requiredLevel === 'DENTIST_ONLY') {
    //   includeConfig.personDentist = true;
    // }

    // // ยิง Database แค่ 1 ครั้งถ้วน!
    // const person = await this.prisma.person.findUnique({
    //   where: { clerkId: clerkId },
    //   include:
    //     Object.keys(includeConfig).length > 0 ? includeConfig : undefined,
    // });

    // if (!person) {
    //   throw new UnauthorizedException('ไม่พบข้อมูลผู้ใช้งานนี้ในระบบ');
    // }

    // // ==========================================
    // // 🛡️ เฟส 3: Business Logic Validation (ตรวจสิทธิ์)
    // // ==========================================
    // if (requiredLevel === 'CLINIC_MEMBER' || requiredLevel === 'DENTIST_ONLY') {
    //   if (
    //     !person.personOrganizationAffiliations ||
    //     person.personOrganizationAffiliations.length === 0
    //   ) {
    //     throw new ForbiddenException(
    //       'คุณไม่มีสิทธิ์เข้าถึงหรือไม่ได้เป็นสมาชิกของคลินิกนี้',
    //     );
    //   }
    // }

    // if (requiredLevel === 'DENTIST_ONLY') {
    //   if (!person.personDentist) {
    //     throw new ForbiddenException(
    //       'เฉพาะทันตแพทย์เท่านั้นที่สามารถใช้งานส่วนนี้ได้',
    //     );
    //   }
    // }

    // // ==========================================
    // // 🎁 เฟส 4: ส่งไม้ต่อให้ Controller
    // // ==========================================
    // request.smartContextGuard = person;
    return true;
  }
}
