import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ==>>==>>== ENUM ==<<==<<==

import {
  // ปรับตามใช้งานจริง
  // eslint-disable-next-line
  TemplateEnumInSchemaPrisma,
  //
} from '@prisma/client';

// ปรับตามใช้งานจริง
export enum TemplateEnum {
  //
  // ปรับตามใช้งานจริง
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',

  // ถ้าเขียนแค่ enum TemplateEnum { ACTIVE, INACTIVE } TypeScript จะมองว่ามันคือ Numeric Enum (ตัวเลข)
}

// ==>>==>>== (จบ) ENUM ==<<==<<==

// ==>>==>>== ฟังก์ชันสำหรับใช้ตรวจสอบ ==<<==<<==

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

// ==>>==>>== (จบ) สร้างฟังก์ชันสำหรับใช้ตรวจสอบ ==<<==<<==

// ==>>==>>== DTO Zod Schema + Backend Type (Param) ==<<==<<==

// ปรับตามใช้งานจริง
export const MethodManyAvailableOtherProgramOtherFeatureDtoParamSchema =
  z.object({
    //
    // ปรับตามใช้งานจริง
    param_uuidv7: z

      // ปรับตามใช้งานจริง
      .uuid({
        // ปรับตามใช้งานจริง
        version: 'v7',

        // ปรับตามใช้งานจริง
        message: 'รูปแบบรหัส...ไม่ถูกต้อง',
      })

      // เลือกระหว่าง
      // - บังคับมีข้อมูล
      // - optional
      // - nullish

      // ปรับตามใช้งานจริง
      .optional() // อนุญาตให้มีค่าเป็น undefined ได้ (ห้ามส่ง null มา)

      // ปรับตามใช้งานจริง
      .nullish(), // อนุญาตให้มีค่าเป็น undefined และ null ได้
  });

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้ (ใช้ใน Backend)

// ปรับตามใช้งานจริง
export class MethodManyAvailableOtherProgramOtherFeatureDtoParam extends createZodDto(
  //
  // ปรับตามใช้งานจริง
  MethodManyAvailableOtherProgramOtherFeatureDtoParamSchema,
) {}

// ==>>==>>== (จบ) DTO Zod Schema + Backend Type (Param) ==<<==<<==

// ==>>==>>== DTO Zod Schema + Backend Type (Body) ==<<==<<==

// ปรับตามใช้งานจริง
export const MethodManyAvailableOtherProgramOtherFeatureDtoBodySchema = z
  .object({
    //
    // ปรับตามใช้งานจริง
    body_string: z
      .string({
        // ปรับตามใช้งานจริง
        message: 'ชื่อ...ต้องเป็น type: string เท่านั้น',
      })
      .trim()
      .min(
        // ปรับตามใช้งานจริง
        1,

        // ปรับตามใช้งานจริง
        'กรุณาระบุชื่อ... (ห้ามเป็นค่าว่าง)',
      ),

    // ปรับตามใช้งานจริง
    body_timezone: z
      .string({
        // ปรับตามใช้งานจริง
        message: 'ชื่อ timezone ต้องเป็น type: string เท่านั้น',
      })
      .trim()
      .refine(
        // ปรับตามใช้งานจริง
        isValidIanaTimezone,
        {
          // ปรับตามใช้งานจริง
          message:
            'timezone ไม่ถูกต้องตามมาตรฐาน IANA (ตัวอย่างที่ถูกต้อง: Asia/Bangkok)',
        },
      ),

    // ปรับตามใช้งานจริง
    body_string_datetime_start_time: z
      .string({
        // ปรับตามใช้งานจริง
        message: 'start_time ต้องเป็น type: string เท่านั้น',
      })
      .datetime({
        //
        // ปรับตามใช้งานจริง

        // อนุญาตให้ส่ง Timezone offset มาได้ เช่น 2026-07-06T08:00:00+07:00
        offset: true,

        // โดยค่าเริ่มต้น (Default) คำสั่ง .datetime() ของ Zod จะเข้มงวดมาก โดยจะบังคับให้ต้องส่งเวลามาเป็น UTC เท่านั้น (ต้องลงท้ายด้วยตัว Z เช่น 2026-07-06T08:00:00Z)
        // การใส่ offset: true คือการเปิดอนุญาตให้สามารถส่งเวลาที่มี Timezone Offset (การบวกลบเวลาท้องถิ่น) เข้ามาได้ครับ เช่น 2026-07-06T08:00:00+07:00 (เวลาไทย) ระบบก็จะยอมให้ผ่านได้

        // ปรับตามใช้งานจริง
        message: 'start_time ต้องอยู่ในรูปแบบ ISO 8601',
      }),

    // ปรับตามใช้งานจริง
    body_string_datetime_end_time: z
      .string({
        // ปรับตามใช้งานจริง
        message: 'end_time ต้องเป็น type: string เท่านั้น',
      })
      .datetime({
        //
        // ปรับตามใช้งานจริง

        // อนุญาตให้ส่ง Timezone offset มาได้ เช่น 2026-07-06T08:00:00+07:00
        offset: true,

        // โดยค่าเริ่มต้น (Default) คำสั่ง .datetime() ของ Zod จะเข้มงวดมาก โดยจะบังคับให้ต้องส่งเวลามาเป็น UTC เท่านั้น (ต้องลงท้ายด้วยตัว Z เช่น 2026-07-06T08:00:00Z)
        // การใส่ offset: true คือการเปิดอนุญาตให้สามารถส่งเวลาที่มี Timezone Offset (การบวกลบเวลาท้องถิ่น) เข้ามาได้ครับ เช่น 2026-07-06T08:00:00+07:00 (เวลาไทย) ระบบก็จะยอมให้ผ่านได้

        // ปรับตามใช้งานจริง
        message: 'end_time ต้องอยู่ในรูปแบบ ISO 8601',
      }),

    // ปรับตามใช้งานจริง
    body_string_hh_mm_start_time: z
      .string({
        // ปรับตามใช้งานจริง
        message: '... ต้องเป็น type: string เท่านั้น',
      })
      // ตรวจสอบฟอร์แมตเวลา HH:mm
      .regex(
        /^([01]\d|2[0-3]):([0-5]\d)$/,

        // ปรับตามใช้งานจริง
        'รูปแบบเวลาไม่ถูกต้อง กรุณาใช้รูปแบบ HH:mm (เช่น 08:00, 20:30)',
      ),

    // ปรับตามใช้งานจริง
    body_int: z
      .number({
        // ปรับตามใช้งานจริง
        message: '... ต้องเป็น type: number เท่านั้น',
      })
      .int({
        // ปรับตามใช้งานจริง
        message: '... ต้องเป็น จำนวนเต็ม เท่านั้น',
      })
      .min(
        // ปรับตามใช้งานจริง
        1,

        // ปรับตามใช้งานจริง
        '... ต้องไม่ต่ำกว่า 1 นาที',
      )
      .max(
        // ปรับตามใช้งานจริง
        1440,

        // ปรับตามใช้งานจริง
        '... ต้องไม่เกิน 1440 นาที',
      ),

    // ปรับตามใช้งานจริง
    body_array: z
      .array(
        z

          // เลือกประเภท Data ของ Array

          // ปรับตามใช้งานจริง
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
            (data) =>
              new Date(data.actual_start_time) < new Date(data.actual_end_time),
            {
              message: 'actualEndTime ต้องมากกว่า actualStartTime เสมอ',

              path: ['actual_end_time'],
            },
          ),
      )

      // ==>>==>>== .array Property ==<<==<<==

      // ปรับตามใช้งานจริง
      .min(1, 'ต้องส่งข้อมูล ... มาอย่างน้อย 1 รายการ'), // บังคับว่าห้ามส่ง Array เปล่าๆ มา

    // ==>>==>>== (จบ) .array Property ==<<==<<==
  })

  // ==>>==>>== .object Property ==<<==<<==

  // ปรับตามใช้งานจริง

  // ตรวจสอบความถูกต้องของช่วงเวลา (เช่น Start < End เสมอ)
  .refine(
    (data) =>
      // ปรับตามใช้งานจริง
      new Date(data.body_string_datetime_start_time) <
      new Date(data.body_string_datetime_end_time),
    {
      // ปรับตามใช้งานจริง
      message: 'end_time ต้องมากกว่า start_time เสมอ',

      // ชี้ field ที่ error เพื่อให้ฝั่ง frontend รู้ว่า error จาก field ไหน (กรณีที่นำไปแสดงผลต่อ)
      // ** ทริค: หากมีตัวแปรมากกว่า 1 ตัว เรามักจะให้ชี้ไปที่ตัวหลัง

      // ปรับตามใช้งานจริง
      path: ['body_string_datetime_end_time'],
    },
  );

// ==>>==>>== (จบ) .object Property ==<<==<<==

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้

// ปรับตามใช้งานจริง
export class MethodManyAvailableOtherProgramOtherFeatureDtoBody extends createZodDto(
  //
  // ปรับตามใช้งานจริง
  MethodManyAvailableOtherProgramOtherFeatureDtoBodySchema,
) {}

// ==>>==>>== (จบ) DTO Zod Schema + Backend Type (Body) ==<<==<<==

// ==>>==>>== "หน้าตาข้อมูล" ขาเข้า ==<<==<<==

// ปรับตามใช้งานจริง
export class MethodManyAvailableOtherProgramOtherFeatureCommand {
  constructor(
    // ปรับตามใช้งานจริง
    public readonly clerkId: string,
    public readonly param: MethodManyAvailableOtherProgramOtherFeatureDtoParam,
    public readonly body: MethodManyAvailableOtherProgramOtherFeatureDtoBody,
  ) {}
}

// ==>>==>>== (จบ) "หน้าตาข้อมูล" ขาเข้า ==<<==<<==

// ==>>==>>== "หน้าตาข้อมูล" ขาออก ==<<==<<==

// หากไม่มีการคืนค่า ก็ลบส่วนนี้ออกได้เลย

// ควรเขียนเอง ตรงนี้จะได้เป็นที่รวมหน้าตาของข้อมูลที่เดียว

// ปรับตามใช้งานจริง
export interface MethodManyAvailableOtherProgramOtherFeatureResponse {
  //
  // ปรับตามใช้งานจริง
  responseDataString: string;

  responseDataArrayString?: string[];

  responseDataObject?: {
    objectDataString: string;
    objectDataArrayString: string[];
  };

  responseDataArrayObject?: {
    objectDataString: string;
    objectDataArrayString: string[];
  }[];

  // ถ้าใน prisma เป็น date ให้ส่งกลับเป็น string เพราะจะเป็น type ที่ frontend ได้รับจริงๆ
  // ถึงแม้ว่าใน Nest มันจะยังเป็น Date แต่ว่าเรามักไม่ค่อยได้ทำอะไรใน Nest แล้วหลังจากออกมาจาก prisma
}

// ==>>==>>== (จบ) "หน้าตาข้อมูล" ขาออก ==<<==<<==

// อย่าลืมไปลงทะเบียน ใน Controller
// อย่าลืมไปลงทะเบียน ใน Handler
