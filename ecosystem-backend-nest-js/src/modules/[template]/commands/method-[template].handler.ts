import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccessControlService } from '../../../common/access-control/access-control.service';

import {
  // ปรับตามใช้งานจริง
  MethodTemplateCommand, // ปรับตามใช้งานจริง
  MethodTemplateResponse, // ปรับตามใช้งานจริง

  // ปรับตามใช้งานจริง
} from './method-[template].command';

@CommandHandler(
  MethodTemplateCommand, // ปรับตามใช้งานจริง
)
// ปรับตามใช้งานจริง
export class MethodTemplateHandler implements ICommandHandler<
  //
  MethodTemplateCommand, // ปรับตามใช้งานจริง
  //
  // หากมีการคืนค่า หากไม่มีก็ลบตรงนี้ออก หรือว่า ใส่เป็น void ได้เลย
  MethodTemplateResponse // ปรับตามใช้งานจริง
> {
  constructor(
    //
    // ปรับตามใช้งานจริง
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    //
    command: MethodTemplateCommand, // ปรับตามใช้งานจริง
    //
  ): Promise<//
  // หากไม่คืนค่าก็ให้ใส่เป็น <void> แทน <MethodTemplateResponse>
  // ปรับตามใช้งานจริง
  MethodTemplateResponse> {
    //
    const {
      //
      // ปรับตามใช้งานจริง
      clerkId,
      param,
      body,
      //
    } = command;

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
    // Create
    // ============================

    // ลบส่วน const newTemplate ออกได้เลย หากไม่มีการคืนค่า
    const newTemplate = // ปรับตามใช้งานจริง
      //
      await this.prisma.template // ปรับตามใช้งานจริง
        .create({
          data: {
            //
            // ปรับตามใช้งานจริง
            title: param.param_uuidv7,
            slug: param.param_uuidv7,
          },
          select: {
            //
            // ปรับตามใช้งานจริง
            id: true,
            title: true,
            //
          },
        });

    // ============================
    // (จบ) Create
    // ============================

    // ============================
    // Upsert
    // ============================

    // ลบส่วน const upsertedTemplate ออกได้เลย หากไม่มีการคืนค่า
    const upsertedTemplate = // ปรับตามใช้งานจริง
      // upsertedTemplate จะคืนค่ามาเป็น object เท่านั้น เพราะว่า prisma บังคับว่า update ได้ทีละ 1 record เท่านั้น
      //
      await this.prisma.template // ปรับตามใช้งานจริง
        .upsert({
          where: {
            //
            // ปรับตามใช้งานจริง
            id: param.param_uuidv7,
            //
          },
          update: {
            //
            // ปรับตามใช้งานจริง
            deletedAt: null,
            //
          },
          create: {
            //
            // ปรับตามใช้งานจริง
            title: param.param_uuidv7,
            slug: param.param_uuidv7,
            //
          },
          select: {
            //
            // ปรับตามใช้งานจริง
            id: true,
            title: true,
            //
          },
        });

    // ============================
    // (จบ) Upsert
    // ============================

    // ============================
    // Update
    // ============================

    // ลบส่วน const updatedTemplate ออกได้เลย หากไม่มีการคืนค่า
    // eslint-disable-next-line
    const updatedTemplate = // ปรับตามใช้งานจริง
      // updatedTemplate จะคืนค่ามาเป็น object เท่านั้น เพราะว่า prisma บังคับว่า update ได้ทีละ 1 record เท่านั้น
      //
      await this.prisma.template // ปรับตามใช้งานจริง
        .update({
          where: {
            //
            // ปรับตามใช้งานจริง
            slug: param.param_uuidv7,
            //
          },
          data: {
            //
            // ปรับตามใช้งานจริง
            title: body.body_string,
            //
          },
          select: {
            //
            // ปรับตามใช้งานจริง
            id: true,
            title: true,
            //
          },
        });

    // ============================
    // (จบ) Update
    // ============================

    // =====================================================================
    // (จบ) Main Logic ของ API
    // =====================================================================

    // ========================================================================
    // 📨 จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type MethodTemplateResponse)
    // ========================================================================

    // หากไม่คืนค่าก็ลบตรงนี้ออกได้เลย
    return {
      //
      // ปรับตามจริง
      response_data_string:
        //
        // ปรับตามใช้งานจริง
        newTemplate.id, // ปรับตามใช้งานจริง

      // ปรับตามใช้งานจริง
      response_data_object: {
        //
        // ปรับตามใช้งานจริง
        data1:
          //
          // ปรับตามใช้งานจริง
          upsertedTemplate.id, // ปรับตามใช้งานจริง
      },
      //
    };

    // ========================================================================
    // 📨 (จบ) จัดเรียงข้อมูล ส่งกลับไปให้ Frontend (ตาม Type MethodTemplateResponse)
    // ========================================================================
  }
}

// อย่าลืมไปลงทะเบียน ใน [template].module.ts
