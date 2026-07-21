import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

//================================
// 🌟 Import ENUM จาก prisma
//================================

import {
  // ปรับตามใช้งานจริง
  // eslint-disable-next-line
  TemplateEnumInSchemaPrisma,
  //
} from '@prisma/client';

//================================
// 🌟 (จบ) Import ENUM จาก prisma
//================================

// ====================================================
// สร้าง ENUM (Frontend เอาไปตรวจ zod ก่อนยิง API ได้)
// ====================================================

// ปรับตามใช้งานจริง
export enum TemplateEnum {
  //
  // ปรับตามใช้งานจริง
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',

  // ถ้าเขียนแค่ enum TemplateEnum { ACTIVE, INACTIVE } TypeScript จะมองว่ามันคือ Numeric Enum (ตัวเลข)
}

// ====================================================
// (จบ) สร้าง ENUM (Frontend เอาไปตรวจ zod ก่อนยิง API ได้)
// ====================================================

// =============================
// สร้างฟังก์ชันสำหรับใช้ตรวจสอบ
// =============================

// ฟังก์ชัน Native JS สำหรับตรวจสอบว่า String นั้นเป็น IANA Timezone ที่ถูกต้องจริงไหม
const isValidIanaTimezone = (tz: string): boolean => {
  try {
    // ถ้าผ่านคำสั่งนี้ได้โดยไม่แครช แปลว่าระบบรองรับ Timezone นี้จริง
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

// =============================
// (จบ) สร้างฟังก์ชันสำหรับใช้ตรวจสอบ
// =============================

// ==========================================
// DTO ขาเข้า (Param)
// ==========================================

export const MethodTemplateDtoParamSchema = // ปรับตามใช้งานจริง
  z.object({
    //
    // ปรับตามใช้งานจริง
    param_uuidv7: z

      // ปรับตามใช้งานจริง
      .uuid({
        version: 'v7', // ปรับตามใช้งานจริง
        message: 'รูปแบบรหัส...ไม่ถูกต้อง', // ปรับตามใช้งานจริง
      }),

    // ปรับตามใช้งานจริง
    param_uuidv7_optional: z

      // ปรับตามใช้งานจริง
      .uuid({
        version: 'v7', // ปรับตามใช้งานจริง
        message: 'รูปแบบรหัส...ไม่ถูกต้อง', // ปรับตามใช้งานจริง
      })

      // ปรับตามใช้งานจริง
      .optional(), // อนุญาตให้ฟิลด์นี้มีค่าเป็น undefined (ห้ามส่ง null มา)

    // ปรับตามใช้งานจริง
    param_uuidv7_nullish: z

      // ปรับตามใช้งานจริง
      .uuid({
        version: 'v7', // ปรับตามใช้งานจริง
        message: 'รูปแบบรหัส...ไม่ถูกต้อง', // ปรับตามใช้งานจริง
      })

      // ปรับตามใช้งานจริง
      .nullish(), // อนุญาตให้เป็นได้ทั้ง undefined (ไม่ส่งมา) และ null

    //
  });

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้ (ใช้ใน Backend)

export class MethodTemplateDtoParam // ปรับตามใช้งานจริง
  extends createZodDto(
    MethodTemplateDtoParamSchema, // ปรับตามใช้งานจริง
  ) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================================
// DTO ขาเข้า (Body)
// ==========================================

// Example of ObjectArray
export const ObjectOfArraySchema = z
  .object({
    name: z
      .string({
        message: 'ชื่อต้องเป็น type: string เท่านั้น',
      })
      .trim()
      .min(1, 'กรุณาระบุชื่อ Slot (ห้ามเป็นค่าว่าง)'),

    actual_start_time: z
      .string({
        message: 'actualStartTime ต้องเป็น type: string เท่านั้น',
      })
      .datetime({
        offset: true,

        message: 'actualStartTime ต้องอยู่ในรูปแบบ ISO 8601',
      }),

    actual_end_time: z
      .string({
        message: 'actualEndTime ต้องเป็น type: string เท่านั้น',
      })
      .datetime({
        offset: true,

        message: 'actualEndTime ต้องอยู่ในรูปแบบ ISO 8601',
      }),
  })
  .refine(
    (data) => new Date(data.actual_start_time) < new Date(data.actual_end_time),
    {
      message: 'actualEndTime ต้องมากกว่า actualStartTime เสมอ',

      path: ['actual_end_time'],
    },
  );
export const ArrayDtoBodySchema = z.object({
  slots: z
    .array(ObjectOfArraySchema)
    .min(1, 'ต้องส่งข้อมูล Slot มาอย่างน้อย 1 รายการ'), // บังคับว่าห้ามส่ง Array เปล่าๆ มา
});
export class ArrayDtoBody extends createZodDto(ArrayDtoBodySchema) {}
// (จบ) Example of ObjectArray

export const MethodTemplateDtoBodySchema = // ปรับตามใช้งานจริง
  z
    .object({
      //
      // ปรับตามใช้งานจริง
      body_string: z

        // ปรับตามใช้งานจริง
        .string({
          message: 'ชื่อ...ต้องเป็น type: string เท่านั้น', // ปรับตามใช้งานจริง
        })
        .trim()
        .min(
          1, // ปรับตามใช้งานจริง
          'กรุณาระบุชื่อ... (ห้ามเป็นค่าว่าง)', // ปรับตามใช้งานจริง
        ),

      // ปรับตามใช้งานจริง
      body_timezone: z

        // ปรับตามใช้งานจริง
        .string({
          message: 'ชื่อ timezone ต้องเป็น type: string เท่านั้น', // ปรับตามใช้งานจริง
        })
        .trim()
        .refine(
          isValidIanaTimezone, // ปรับตามใช้งานจริง
          {
            message:
              'timezone ไม่ถูกต้องตามมาตรฐาน IANA (ตัวอย่างที่ถูกต้อง: Asia/Bangkok)', // ปรับตามใช้งานจริง
          },
        ),

      // ปรับตามใช้งานจริง
      body_string_datetime_start_time: z

        // ปรับตามใช้งานจริง
        .string({
          message: 'actualStartTime ต้องเป็น type: string เท่านั้น', // ปรับตามใช้งานจริง
        })
        .datetime({
          //
          // ปรับตามใช้งานจริง

          // อนุญาตให้ส่ง Timezone offset มาได้ เช่น 2026-07-06T08:00:00+07:00
          offset: true, // ปรับตามใช้งานจริง

          // โดยค่าเริ่มต้น (Default) คำสั่ง .datetime() ของ Zod จะเข้มงวดมาก โดยจะบังคับให้ต้องส่งเวลามาเป็น UTC เท่านั้น (ต้องลงท้ายด้วยตัว Z เช่น 2026-07-06T08:00:00Z)
          // การใส่ offset: true คือการเปิดอนุญาตให้สามารถส่งเวลาที่มี Timezone Offset (การบวกลบเวลาท้องถิ่น) เข้ามาได้ครับ เช่น 2026-07-06T08:00:00+07:00 (เวลาไทย) ระบบก็จะยอมให้ผ่านได้

          message: 'actualStartTime ต้องอยู่ในรูปแบบ ISO 8601', // ปรับตามใช้งานจริง
        }),

      // ปรับตามใช้งานจริง
      body_string_datetime_end_time: z

        // ปรับตามใช้งานจริง
        .string({
          message: 'actualEndTime ต้องเป็น type: string เท่านั้น', // ปรับตามใช้งานจริง
        })
        .datetime({
          //
          // ปรับตามใช้งานจริง

          // อนุญาตให้ส่ง Timezone offset มาได้ เช่น 2026-07-06T08:00:00+07:00
          offset: true, // ปรับตามใช้งานจริง

          // โดยค่าเริ่มต้น (Default) คำสั่ง .datetime() ของ Zod จะเข้มงวดมาก โดยจะบังคับให้ต้องส่งเวลามาเป็น UTC เท่านั้น (ต้องลงท้ายด้วยตัว Z เช่น 2026-07-06T08:00:00Z)
          // การใส่ offset: true คือการเปิดอนุญาตให้สามารถส่งเวลาที่มี Timezone Offset (การบวกลบเวลาท้องถิ่น) เข้ามาได้ครับ เช่น 2026-07-06T08:00:00+07:00 (เวลาไทย) ระบบก็จะยอมให้ผ่านได้

          message: 'actualEndTime ต้องอยู่ในรูปแบบ ISO 8601', // ปรับตามใช้งานจริง
        }),

      // ปรับตามใช้งานจริง
      body_string_hh_mm_start_time: z

        // ปรับตามใช้งานจริง
        .string({
          message: '... ต้องเป็น type: string เท่านั้น', // ปรับตามใช้งานจริง
        })
        // ตรวจสอบฟอร์แมตเวลา HH:mm
        .regex(
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          'รูปแบบเวลาไม่ถูกต้อง กรุณาใช้รูปแบบ HH:mm (เช่น 08:00, 20:30)', // ปรับตามใช้งานจริง
        ),

      // ปรับตามใช้งานจริง
      body_int: z

        // ปรับตามใช้งานจริง
        .number({
          message: '... ต้องเป็น type: number เท่านั้น', // ปรับตามใช้งานจริง
        })
        .int({
          message: '... ต้องเป็น จำนวนเต็มบวก เท่านั้น', // ปรับตามใช้งานจริง
        })
        .min(
          1, // ปรับตามใช้งานจริง
          '... ต้องไม่ต่ำกว่า 1 นาที', // ปรับตามใช้งานจริง
        )
        .max(
          1440, // ปรับตามใช้งานจริง
          '... ต้องไม่เกิน 24 ชั่วโมง', // ปรับตามใช้งานจริง
        ),

      // ปรับตามใช้งานจริง
      body_array: z
        .array(ObjectOfArraySchema) // ปรับตามใช้งานจริง
        .min(1, 'ต้องส่งข้อมูล Slot มาอย่างน้อย 1 รายการ'), // บังคับว่าห้ามส่ง Array เปล่าๆ มา
    })

    // ตรวจสอบความถูกต้องของช่วงเวลา (เช่น Start < End เสมอ)

    // ปรับตามใช้งานจริง
    .refine(
      (data) =>
        new Date(
          data.body_string_datetime_start_time, // ปรับตามใช้งานจริง

          //
        ) < // ปรับตามใช้งานจริง
        //
        new Date(
          data.body_string_datetime_end_time, // ปรับตามใช้งานจริง
        ),
      {
        message: 'actualEndTime ต้องมากกว่า actualStartTime เสมอ', // ปรับตามใช้งานจริง

        // ชี้ field ที่ error เพื่อให้ฝั่ง frontend รู้ว่า error จาก field ไหน (กรณีที่นำไปแสดงผลต่อ)
        // ** ทริค: หากมีตัวแปรมากกว่า 1 ตัว เรามักจะให้ชี้ไปที่ตัวหลัง

        // ปรับตามใช้งานจริง
        path: ['body_string_datetime_end_time'], // ปรับตามใช้งานจริง
      },
    );

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้
export class MethodTemplateDtoBody // ปรับตามใช้งานจริง
  extends createZodDto(
    MethodTemplateDtoBodySchema, // ปรับตามใช้งานจริง
  ) {}

// ==========================================
// (จบ) DTO ขาเข้า (Body)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

// ปรับตามใช้งานจริง
export class MethodTemplateCommand {
  constructor(
    //
    // ปรับตามใช้งานจริง
    public readonly clerkId: string,
    public readonly param: MethodTemplateDtoParam, // ปรับตามใช้งานจริง
    public readonly body: MethodTemplateDtoBody, // ปรับตามใช้งานจริง
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================

// ============================================================
// 🚀 "หน้าตาข้อมูล" ขาออก (หากไม่มีการคืนค่า ก็ลบส่วนนี้ออกได้เลย)
// ============================================================

// เขียนเอง, ใช้ Omit, ใช้ Pick (ควรเขียนเอง ตรงนี้จะได้เป็นที่รวมหน้าตาของ Response ที่เดียว ไม่ต้องไปหาต่อ)

// ปรับตามใช้งานจริง
export interface MethodTemplateResponse {
  //
  // ปรับตามใช้งานจริง
  responseDataString: string;
  responseDataObject: {
    data1: string;
  };
}

// ============================================================
// 🚀 (จบ) "หน้าตาข้อมูล" ขาออก (หากไม่มีการคืนค่า ก็ลบส่วนนี้ออกได้เลย)
// ============================================================

// อย่าลืมไปลงทะเบียน ใน [template].controller.ts
// อย่าลืมไปลงทะเบียน ใน method-[template].handler.ts
