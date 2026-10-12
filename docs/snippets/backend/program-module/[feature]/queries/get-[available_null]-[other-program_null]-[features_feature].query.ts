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
// eslint-disable-next-line
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
export const GetAvailableOtherProgramFeaturesDtoParamSchema = z.object({
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
export class GetAvailableOtherProgramFeaturesDtoParam extends createZodDto(
  //
  // ปรับตามใช้งานจริง
  GetAvailableOtherProgramFeaturesDtoParamSchema,
) {}

// ==>>==>>== (จบ) DTO Zod Schema + Backend Type (Param) ==<<==<<==

// ==>>==>>== DTO Zod Schema + Backend Type (Query) ==<<==<<==

// ปรับตามใช้งานจริง
export const GetAvailableOtherProgramFeaturesDtoQuerySchema = z
  .object({
    //
    // Query มีข้อจำกัดและรายละเอียดการใช้ที่แตกต่างจาก Body อยู่บ้าง
    // ตอนใช้จริงต้องศึกษาและเขียน snippet ของตัวเอง

    // ปรับตามใช้งานจริง
    query_string: z
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
    query_string_datetime_start_time: z
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
    query_string_datetime_end_time: z
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

    //
  })

  // ==>>==>>== .object Property ==<<==<<==

  // ปรับตามใช้งานจริง

  // ตรวจสอบความถูกต้องของช่วงเวลา (เช่น Start < End เสมอ)
  .refine(
    (data) =>
      // ปรับตามใช้งานจริง
      new Date(data.query_string_datetime_start_time) <
      new Date(data.query_string_datetime_end_time),
    {
      // ปรับตามใช้งานจริง
      message:
        'query_string_datetime_end_time ต้องมีค่ามากกว่า query_string_datetime_start_time เสมอ',

      // ชี้ field ที่ error เพื่อให้ฝั่ง frontend รู้ว่า error จาก field ไหน (กรณีที่นำไปแสดงผลต่อ)
      // ** ทริค: หากมีตัวแปรมากกว่า 1 ตัว เรามักจะให้ชี้ไปที่ตัวหลัง

      // ปรับตามใช้งานจริง
      path: ['query_string_datetime_end_time'],
    },
  );

// ==>>==>>== (จบ) .object Property ==<<==<<==

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้ (ใช้ใน Backend)

// ปรับตามใช้งานจริง
export class GetAvailableOtherProgramFeaturesDtoQuery extends createZodDto(
  //
  // ปรับตามใช้งานจริง
  GetAvailableOtherProgramFeaturesDtoQuerySchema,
) {}

// ==>>==>>== (จบ) DTO Zod Schema + Backend Type (Query) ==<<==<<==

// ==>>==>>== "หน้าตาข้อมูล" ขาเข้า ==<<==<<==

// ปรับตามใช้งานจริง
export class GetAvailableOtherProgramFeaturesQuery {
  constructor(
    // ปรับตามใช้งานจริง
    public readonly clerkId: string,
    public readonly param: GetAvailableOtherProgramFeaturesDtoParam,
    public readonly queryFromUrl: GetAvailableOtherProgramFeaturesDtoQuery,
  ) {}
}

// ==>>==>>== (จบ) "หน้าตาข้อมูล" ขาเข้า ==<<==<<==

// ==>>==>>== "หน้าตาข้อมูล" ขาออก ==<<==<<==

// ควรเขียนเอง ตรงนี้จะได้เป็นที่รวมหน้าตาของข้อมูลที่เดียว

// ปรับตามใช้งานจริง
export interface GetAvailableOtherProgramFeaturesResponse {
  //
  // ปรับตามใช้งานจริง
  responseDataString: string;

  responseDataArrayString: string[];

  responseDataObject: {
    objectDataString: string;
    objectDataArrayString: string[];
  };

  responseDataArrayObject: {
    objectDataString: string;
    objectDataArrayString: string[];
  }[];

  // ถ้าใน prisma เป็น date ให้ส่งกลับเป็น string เพราะจะเป็น type ที่ frontend ได้รับจริงๆ
  // ถึงแม้ว่าใน Nest มันจะยังเป็น Date แต่ว่าเรามักไม่ค่อยได้ทำอะไรใน Nest แล้วหลังจากออกมาจาก prisma
}

// ==>>==>>== (จบ) "หน้าตาข้อมูล" ขาออก ==<<==<<==

// อย่าลืมไปลงทะเบียน ใน Controller
// อย่าลืมไปลงทะเบียน ใน Handler
