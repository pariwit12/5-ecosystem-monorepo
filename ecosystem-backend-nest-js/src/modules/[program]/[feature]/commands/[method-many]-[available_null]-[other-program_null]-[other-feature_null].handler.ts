import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AccessControlService } from '../../../../common/access-control/access-control.service';

import {
  // ปรับตามใช้งานจริง
  MethodManyAvailableOtherProgramOtherFeatureCommand,
  MethodManyAvailableOtherProgramOtherFeatureResponse,

  // ปรับตามใช้งานจริง
} from './[method-many]-[available_null]-[other-program_null]-[other-feature_null].command';

@CommandHandler(
  // ปรับตามใช้งานจริง
  MethodManyAvailableOtherProgramOtherFeatureCommand,
)

// ปรับตามใช้งานจริง
export class MethodManyAvailableOtherProgramOtherFeatureHandler implements ICommandHandler<
  //
  // ปรับตามใช้งานจริง
  MethodManyAvailableOtherProgramOtherFeatureCommand,
  //
  // หากไม่มีการคืนค่า ให้ใส่ void แทน
  MethodManyAvailableOtherProgramOtherFeatureResponse
> {
  constructor(
    //
    // ปรับตามใช้งานจริง
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService,
  ) {}

  async execute(
    // ปรับตามใช้งานจริง
    command: MethodManyAvailableOtherProgramOtherFeatureCommand,
  ): Promise<//
  // ปรับตามใช้งานจริง
  // หากไม่มีการคืนค่า ให้ใส่ void แทน
  MethodManyAvailableOtherProgramOtherFeatureResponse> {
    const {
      // ปรับตามใช้งานจริง
      clerkId,
      param,
      body,
    } = command;

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

    // ==>>==>>== Create ==<<==<<==

    // ปรับตามใช้งานจริง
    // ลบออกได้เลย หากไม่มีการคืนค่า
    const newTemplate =
      //
      // ปรับตามใช้งานจริง
      await this.prisma.template.create({
        data: {
          // ปรับตามใช้งานจริง
          title: param.param_uuidv7!,
          slug: param.param_uuidv7!,
        },
        select: {
          // ปรับตามใช้งานจริง
          // หากไม่ต้องการข้อมูลตอบกลับ ให้เลือก select field ที่ข้อมูลขนาดเล็กส่งมา
          // ถ้าลบ select ออก DB จะส่งกลับมาทุก field
          id: true,
          title: true,
        },
      });

    // ==>>==>>== (จบ) Create ==<<==<<==

    // ==>>==>>== CreateMany ==<<==<<==

    // ประกอบร่างข้อมูล Array ให้พร้อมสำหรับ Prisma

    // ปรับตามใช้งานจริง
    const arrayObjectToInsert =
      //
      // ปรับตามใช้งานจริง
      body.body_array.map(
        //
        // ปรับตามใช้งานจริง
        (bodyObj) => ({
          // ปรับตามใช้งานจริง
          workSchedulePositionId: param.param_uuidv7!,
          name: bodyObj.name,
          actualStartTime: bodyObj.actual_start_time,
          actualEndTime: bodyObj.actual_end_time,
        }),
      );

    // ปรับตามใช้งานจริง
    await this.prisma.workScheduleSlot.createMany({
      //
      // ปรับตามใช้งานจริง
      data: arrayObjectToInsert,
      // skipDuplicates: false, // ถ้าอยากให้มันข้ามตัวที่ซ้ำกัน (ต้องมี @@unique index รองรับ) สามารถเปิดใช้ได้ครับ
      // โดยเมื่อคุณเปิดใช้งาน skipDuplicates: true
      // ทาง Prisma จะแปลงคำสั่ง SQL หลังบ้านเป็น ON CONFLICT DO NOTHING (สำหรับ PostgreSQL)
      // ซึ่งจะทำการ ข้าม (Ignore) ข้อมูลที่ซ้ำทันทีโดยไม่โยน Error ออกมา และรายการอื่นๆ ที่ไม่ซ้ำก็จะถูกบันทึกตามปกติครับ
    });

    // หมายเหตุ: createMany จะไม่สามารถ select { id: true } กลับมาได้เหมือน create ปกติ
    // แต่มันมักจะไม่เป็นปัญหาเพราะ API นี้เป็น Command (CQRS) ที่ return void อยู่แล้วครับ

    // ==>>==>>== (จบ) CreateMany ==<<==<<==

    // ==>>==>>== CreateManyAndReturn ==<<==<<==

    // มีให้ใช้ใน Prisma 5.14.0 ขึ้นไป
    // รอจัดการ snippet ให้พร้อมใช้งาน ตอนนี้ใส่ไว้ให้รู้ว่ามีทางเลือกนี้

    // ประกอบร่างข้อมูล Array ให้พร้อมสำหรับ Prisma

    // ปรับตามใช้งานจริง
    const arrayObjectToInsertTwo =
      //
      // ปรับตามใช้งานจริง
      body.body_array.map(
        //
        // ปรับตามใช้งานจริง
        (bodyObj) => ({
          // ปรับตามใช้งานจริง
          workScheduleStaffId: bodyObj.name,
          workSchedulePositionId: param.param_uuidv7!,
        }),
      );

    // eslint-disable-next-line
    const result =
      await this.prisma.workScheduleStaffPosition.createManyAndReturn({
        data: arrayObjectToInsertTwo,
        skipDuplicates: true,

        // Property ที่เพิ่มเข้ามาใน createManyAndReturn (Prisma 5.14+)
        select: {
          workSchedulePositionId: true,
          workScheduleStaffId: true,
        },
        // หรือใช้ include (อย่างใดอย่างหนึ่ง)
        // include: { workScheduleStaff: true }
      });

    // เปรียบเทียบ response จาก createMany และ createManyAndReturn
    // createMany: { count: number }
    // createManyAndReturn: [ { id: '1', ... }, { id: '2', ... } ]

    // ==>>==>>== (จบ) CreateManyAndReturn ==<<==<<==

    // ==>>==>>== Upsert ==<<==<<==

    // ปรับตามใช้งานจริง
    // ลบออกได้เลย หากไม่มีการคืนค่า
    // eslint-disable-next-line
    const upsertedTemplate =
      //
      // upsertedTemplate จะคืนค่ามาเป็น object เท่านั้น เพราะว่า prisma บังคับว่า update ได้ทีละ 1 record เท่านั้น

      // ปรับตามใช้งานจริง
      await this.prisma.template.upsert({
        where: {
          // ปรับตามใช้งานจริง
          id: param.param_uuidv7!,
        },
        update: {
          // ปรับตามใช้งานจริง
          // สามารปล่อยว่างได้ เช่น update: {},
          deletedAt: null,
        },
        create: {
          // ปรับตามใช้งานจริง
          title: param.param_uuidv7!,
          slug: param.param_uuidv7!,
        },
        select: {
          // ปรับตามใช้งานจริง
          // หากไม่ต้องการข้อมูลตอบกลับ ให้เลือก select field ที่ข้อมูลขนาดเล็กส่งมา
          // ถ้าลบ select ออก DB จะส่งกลับมาทุก field
          id: true,
          title: true,
        },
      });

    // ==>>==>>== (จบ) Upsert ==<<==<<==

    // ==>>==>>== Update ==<<==<<==

    // ปรับตามใช้งานจริง
    // ลบออกได้เลย หากไม่มีการคืนค่า
    // eslint-disable-next-line
    const updatedTemplate =
      //
      // updatedTemplate จะคืนค่ามาเป็น object เท่านั้น เพราะว่า prisma บังคับว่า update ได้ทีละ 1 record เท่านั้น

      // ปรับตามใช้งานจริง
      await this.prisma.template.update({
        where: {
          // ปรับตามใช้งานจริง
          slug: param.param_uuidv7!,
        },
        data: {
          // ปรับตามใช้งานจริง
          title: body.body_string,
        },
        select: {
          // ปรับตามใช้งานจริง
          // หากไม่ต้องการข้อมูลตอบกลับ ให้เลือก select field ที่ข้อมูลขนาดเล็กส่งมา
          // ถ้าลบ select ออก DB จะส่งกลับมาทุก field
          id: true,
          title: true,
        },
      });

    // ==>>==>>== (จบ) Update ==<<==<<==

    // ==>>==>>== (จบ) Main Logic ของ API ==<<==<<==

    // ==>>==>>== 📨 จัดเรียงข้อมูล เตรียมส่งกลับ (ตาม Type MethodTemplateResponse) ==<<==<<==

    // หากไม่คืนค่าก็ลบตรงนี้ออกได้เลย

    return {
      // ปรับตามใช้งานจริง
      responseDataString: newTemplate.id,

      // แบบอื่นๆ ดูการเรียกใช้ใน GET Handler
    };

    // ==>>==>>== 📨 (จบ) จัดเรียงข้อมูล เตรียมส่งกลับ (ตาม Type MethodTemplateResponse) ==<<==<<==
  }
}

// อย่าลืมไปลงทะเบียน ใน Module
