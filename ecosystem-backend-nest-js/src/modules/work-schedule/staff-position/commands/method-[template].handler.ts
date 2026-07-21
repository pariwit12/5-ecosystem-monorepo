import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

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
  // หากมีการคืนค่า หากไม่มีก็ใส่เป็น void หรือว่า ลบตรงนี้ออกได้เลย
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
            // หากไม่ต้องการข้อมูลตอบกลับ ให้เลือก select field ที่ข้อมูลขนาดเล็กส่งมา (ถ้าลบ select ออก DB จะส่งกลับมาทุก field)
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
    // CreateMany (Batch)
    // ============================

    // 🌟 1. ประกอบร่างข้อมูล Array ให้พร้อมสำหรับ Prisma
    const slotsToInsert = body.body_array.map((slot) => ({
      workSchedulePositionId: param.param_uuidv7,
      name: slot.name,
      actualStartTime: slot.actual_start_time,
      actualEndTime: slot.actual_end_time,
    }));

    // 🌟 2. ใช้ createMany ยิงเข้า Database ในคราวเดียว (เร็วและไม่เปลือง Connection)
    await this.prisma.workScheduleSlot.createMany({
      data: slotsToInsert,
      // skipDuplicates: false, // ถ้าอยากให้มันข้ามตัวที่ซ้ำกัน (ต้องมี @@unique index รองรับ) สามารถเปิดใช้ได้ครับ
    });

    // หมายเหตุ: createMany จะไม่สามารถ select { id: true } กลับมาได้เหมือน create ปกติ
    // แต่มันมักจะไม่เป็นปัญหาเพราะ API นี้เป็น Command (CQRS) ที่ return void อยู่แล้วครับ

    // ============================
    // (จบ) CreateMany (Batch)
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
            // สามารปล่อยว่างได้ = update: {},

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
            // หากไม่ต้องการข้อมูลตอบกลับ ให้เลือก select field ที่ข้อมูลขนาดเล็กส่งมา (ถ้าลบ select ออก DB จะส่งกลับมาทุก field)
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
            // หากไม่ต้องการข้อมูลตอบกลับ ให้เลือก select field ที่ข้อมูลขนาดเล็กส่งมา (ถ้าลบ select ออก DB จะส่งกลับมาทุก field)
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
      responseDataString:
        //
        // ปรับตามใช้งานจริง
        newTemplate.id, // ปรับตามใช้งานจริง

      // ปรับตามใช้งานจริง
      responseDataObject: {
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
