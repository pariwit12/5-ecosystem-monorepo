import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';
import { AppException } from '../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../common/exceptions/error-codes.enum';
import { HttpStatus } from '@nestjs/common';

import {
  // ปรับตามใช้งานจริง
  GetTemplateQuery, // ปรับตามใช้งานจริง
  GetTemplateResponse, // ปรับตามใช้งานจริง

  // ปรับตามใช้งานจริง
} from './get-[template].query';

@QueryHandler(
  GetTemplateQuery, // ปรับตามใช้งานจริง
)
// ปรับตามใช้งานจริง
export class GetTemplateHandler implements IQueryHandler<
  //
  GetTemplateQuery, // ปรับตามใช้งานจริง
  GetTemplateResponse // ปรับตามใช้งานจริง
> {
  constructor(
    //
    // ปรับตามใช้งานจริง
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    //
    query: GetTemplateQuery, // ปรับตามใช้งานจริง
    //
  ): Promise<//
  // ปรับตามใช้งานจริง
  GetTemplateResponse> {
    //
    const {
      //
      // ปรับตามใช้งานจริง
      clerkId,
      param,
      // eslint-disable-next-line
      queryFromUrl,
      //
    } = query;

    // ===========================
    // ตรวจสอบ AccessControl
    // ===========================

    const {
      //
      // ปรับตามใช้งานจริง
      // eslint-disable-next-line
      personId,
      //
    } = await this.accessControlService
      //
      // ปรับตามใช้งานจริง
      .verifyOrganizationAccess(
        //
        // ปรับตามใช้งานจริง
        clerkId,
        param.param_uuidv7,
        //
      );

    // ===========================
    // (จบ) ตรวจสอบ AccessControl
    // ===========================

    // =====================================================================
    // Main Logic ของ API
    // =====================================================================

    // ============================
    // FindFirst / FindUnique
    // ============================

    const template = // ปรับตามใช้งานจริง
      //
      await this.prisma.template // ปรับตามใช้งานจริง
        .findFirst({
          where: {
            //
            // ปรับตามใช้งานจริง
            id: param.param_uuidv7,
            deletedAt: null,
          },
          select: {
            //
            // ปรับตามใช้งานจริง
            id: true,
          },
        });

    // --------------------------------------------------
    // --------- สำหรับ findFirst หรือ findUnique ---------

    // ตรวจว่า data เป็น object ไม่ใช่ null ก่อนจะ return (ไม่งั้น TS จะบ่น)
    // แต่ตามตรรกะเราควรตรวจแล้ว ในขั้นตอน AccessControl

    // ถือว่าตรวจเผื่อมีการแก้ไขระหว่างเวลา ดึงจริง กับ ตรวจ AccessControl

    // ปรับตามใช้งานจริง
    if (!template) {
      //
      throw new AppException(
        //
        ErrorCode.ORGANIZATION_NOT_FOUND, // ปรับตามใช้งานจริง

        'TemplateId นี้ไม่มีในตาราง Template', // ปรับตามใช้งานจริง

        HttpStatus.NOT_FOUND, // ปรับตามใช้งานจริง
      );
    }

    // --------------------------------------------------

    // ============================
    // (จบ) FindFirst / FindUnique
    // ============================

    // ============================
    // FindMany
    // ============================

    const templates = // ปรับตามใช้งานจริง
      //
      await this.prisma.templateTwo // ปรับตามใช้งานจริง
        .findMany({
          where: {
            //
            // ปรับตามใช้งานจริง
            templateOneTemplateTwoAffiliations: {
              some: {
                templateTwoId: param.param_uuidv7,
              },
            },
          },
          select: {
            //
            // ปรับตามใช้งานจริง
            id: true,
          },
          orderBy: [
            //
            // ปรับตามใช้งานจริง
            // { deletedAt: 'asc' }, // ปรับตามใช้งานจริง
            { id: 'asc' }, // ปรับตามใช้งานจริง
          ],
        });

    // ============================
    // (จบ) FindMany
    // ============================

    // ============================
    // 🚀 (จบ) Promise.all
    // ============================

    const [
      // ปรับตามใช้งานจริง
      // eslint-disable-next-line
      templatesAsA,
      // eslint-disable-next-line
      templatesAsB,
      //
    ] = await Promise.all([
      //
      // API 1
      this.prisma.template // ปรับตามใช้งานจริง

        // ปรับตามใช้งานจริง
        .findMany({
          //
          where: {
            //
            // ปรับตามใช้งานจริง
            deletedAt: null,
          },
          select: {
            //
            // ปรับตามใช้งานจริง
            id: true,
          },
          orderBy: [
            //
            // ปรับตามใช้งานจริง
            { deletedAt: 'asc' }, // ปรับตามใช้งานจริง
            { id: 'asc' }, // ปรับตามใช้งานจริง
          ],
        }),

      // API 2
      this.prisma.template // ปรับตามใช้งานจริง

        // ปรับตามใช้งานจริง
        .findMany({
          //
          where: {
            //
            // ปรับตามใช้งานจริง
            deletedAt: null,
            templateOneTemplateTwoAffiliation: {
              templateTwoId: param.param_uuidv7,
            },
          },
          select: {
            //
            // ปรับตามใช้งานจริง
            id: true,
          },
          orderBy: [
            //
            // ปรับตามใช้งานจริง
            { deletedAt: 'asc' }, // ปรับตามใช้งานจริง
            { id: 'asc' }, // ปรับตามใช้งานจริง
          ],
        }),
    ]);

    // ============================
    // 🚀 (จบ) Promise.all
    // ============================

    // =====================================================================
    // (จบ) Main Logic ของ API
    // =====================================================================

    // =====================================================================
    // 📨 จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type GetTemplateResponse)
    // =====================================================================

    return {
      //
      // ปรับตามใช้งานจริง
      response_data_string:
        //
        // ปรับตามใช้งานจริง
        template.id, // ปรับตามใช้งานจริง

      // ปรับตามใช้งานจริง
      response_data_object: {
        //
        // ปรับตามใช้งานจริง
        data1:
          //
          // ปรับตามใช้งานจริง
          template.id, // ปรับตามใช้งานจริง
      },

      // ปรับตามใช้งานจริง
      response_data_array_object:
        //
        // ปรับตามใช้งานจริง
        templates.map(
          (
            temp, // ปรับตามใช้งานจริง
          ) => ({
            //
            // ปรับตามใช้งานจริง
            data1:
              //
              // ปรับตามใช้งานจริง
              temp.id, // ปรับตามใช้งานจริง
          }),
        ),
    };

    // =====================================================================
    // 📨 (จบ) จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type GetTemplateResponse)
    // =====================================================================
  }
}

// อย่าลืมไปลงทะเบียน ใน [template].module.ts
