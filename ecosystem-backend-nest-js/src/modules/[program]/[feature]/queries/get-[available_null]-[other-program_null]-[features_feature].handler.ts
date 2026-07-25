import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';
import { AppException } from '../../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../../common/exceptions/error-codes.enum';
import { HttpStatus } from '@nestjs/common';

import {
  // ปรับตามใช้งานจริง
  GetAvailableOtherProgramFeaturesQuery,
  GetAvailableOtherProgramFeaturesResponse,

  // ปรับตามใช้งานจริง
} from './get-[available_null]-[other-program_null]-[features_feature].query';

@QueryHandler(
  // ปรับตามใช้งานจริง
  GetAvailableOtherProgramFeaturesQuery,
)
// ปรับตามใช้งานจริง
export class GetAvailableOtherProgramFeaturesHandler implements IQueryHandler<
  //
  // ปรับตามใช้งานจริง
  GetAvailableOtherProgramFeaturesQuery,
  GetAvailableOtherProgramFeaturesResponse
> {
  constructor(
    //
    // ปรับตามใช้งานจริง
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    // ปรับตามใช้งานจริง
    query: GetAvailableOtherProgramFeaturesQuery,
  ): Promise<//
  // ปรับตามใช้งานจริง
  GetAvailableOtherProgramFeaturesResponse> {
    const {
      // ปรับตามใช้งานจริง
      clerkId,
      param,
      // eslint-disable-next-line
      queryFromUrl,
    } = query;

    // ==>>==>>== ตรวจสอบ AccessControl ==<<==<<==

    const {
      // ปรับตามใช้งานจริง
      // eslint-disable-next-line
      personId,
    } = await this.accessControlService
      //
      // ปรับตามใช้งานจริง
      .verifyOrganizationAccess(
        //
        // ปรับตามใช้งานจริง
        clerkId,
        param.param_uuidv7!,
      );

    // ==>>==>>== (จบ) ตรวจสอบ AccessControl ==<<==<<==

    // ==>>==>>== Main Logic ของ API ==<<==<<==

    // ==>>==>>== FindFirst / FindUnique ==<<==<<==

    // ปรับตามใช้งานจริง
    const template =
      //
      // ปรับตามใช้งานจริง
      await this.prisma.template.findFirst({
        where: {
          // ปรับตามใช้งานจริง
          id: param.param_uuidv7!,
          deletedAt: null,
        },
        select: {
          // ปรับตามใช้งานจริง
          id: true,
        },
      });

    // สำหรับ findFirst หรือ findUnique

    // ตรวจว่า data เป็น object ไม่ใช่ null ก่อนจะ return (ไม่งั้น TS จะบ่น)
    // แต่ตามตรรกะเราควรตรวจแล้ว ในขั้นตอน AccessControl
    // ถือว่าตรวจเผื่อมีการแก้ไขระหว่างเวลา ดึงจริง กับ ตรวจ AccessControl

    // ปรับตามใช้งานจริง
    if (!template) {
      throw new AppException(
        //
        // ปรับตามใช้งานจริง
        ErrorCode.ORGANIZATION_NOT_FOUND,

        // ปรับตามใช้งานจริง
        'TemplateId นี้ไม่มีในตาราง Template',

        // ปรับตามใช้งานจริง
        HttpStatus.NOT_FOUND,
      );
    }

    // ==>>==>>== (จบ) FindFirst / FindUnique ==<<==<<==

    // ==>>==>>== FindMany ==<<==<<==

    // ปรับตามใช้งานจริง
    const templates =
      //
      // ปรับตามใช้งานจริง
      await this.prisma.templateTwo.findMany({
        where: {
          // ปรับตามใช้งานจริง

          // สรุปหลักการจำง่ายๆ สำหรับ Prisma
          // - none, some, every ใช้ได้กับ Relation Field แบบ Array (List) เท่านั้น
          // - not, in, notIn, equals ใช้กับ Scalar Field (เช่น string, number, boolean)
          // - AND, OR, NOT ใช้ที่ Root Level หรือซ้อนใน Object ของเงื่อนไข

          id: param.param_uuidv7!,

          templateOneTemplateTwoAffiliations: {
            //
            // ปรับตามใช้งานจริง
            some: {
              templateTwoId: param.param_uuidv7!,
            },
            none: {
              templateOneId: param.param_uuidv7!,
            },
          },
        },
        select: {
          // ปรับตามใช้งานจริง
          id: true,
        },
        orderBy: [
          // ปรับตามใช้งานจริง
          { templateOneId: 'desc' },
          { id: 'asc' },
        ],
      });

    // ==>>==>>== (จบ) FindMany ==<<==<<==

    // ==>>==>>== 🚀 Promise.all ==<<==<<==

    const [
      // ปรับตามใช้งานจริง
      // eslint-disable-next-line
      templatesAsA,
      // eslint-disable-next-line
      templatesAsB,
    ] = await Promise.all([
      //
      // ปรับตามใช้งานจริง
      // API 1

      // ปรับตามใช้งานจริง
      this.prisma.template

        // ปรับตามใช้งานจริง
        .findFirst({
          // ปรับตามใช้งานจริง
          // ใช้ snippet จาก findFirst, findUnique หรือ findMany
        }),

      // ปรับตามใช้งานจริง
      // API 2

      // ปรับตามใช้งานจริง
      this.prisma.template

        // ปรับตามใช้งานจริง
        .findMany({
          // ปรับตามใช้งานจริง
          // ใช้ snippet จาก findFirst, findUnique หรือ findMany
        }),
    ]);

    // ==>>==>>== 🚀 (จบ) Promise.all ==<<==<<==

    // ==>>==>>== (จบ) Main Logic ของ API ==<<==<<==

    // ==>>==>>== 📨 จัดเรียงข้อมูล เตรียมส่งกลับ (ตาม Type GetTemplateResponse) ==<<==<<==

    return {
      // ปรับตามใช้งานจริง
      responseDataString: template.id,

      responseDataArrayString: templates.map((temp) => temp.id),

      responseDataObject: {
        objectDataString: template.id,
        objectDataArrayString: ['123', '234'],
      },

      responseDataArrayObject:
        //
        // ปรับตามใช้งานจริง
        templates.map(
          // ปรับตามใช้งานจริง
          (temp) => ({
            //
            // ปรับตามใช้งานจริง
            objectDataString: temp.id,
            objectDataArrayString: ['123', '234'],
          }),
        ),
    };

    // ==>>==>>== 📨 (จบ) จัดเรียงข้อมูล เตรียมส่งกลับ (ตาม Type GetTemplateResponse) ==<<==<<==
  }
}

// อย่าลืมไปลงทะเบียน ใน Module
