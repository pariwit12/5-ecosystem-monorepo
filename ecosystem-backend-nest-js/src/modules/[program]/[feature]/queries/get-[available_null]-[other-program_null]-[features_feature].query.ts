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
export const GetAvailableOtherProgramFeaturesDtoQuerySchema = z.object({
  //
  // Query มีข้อจำกัดและรายละเอียดการใช้ที่แตกต่างจาก Body อยู่บ้าง
  // ตอนใช้จริงต้องศึกษาและเขียน snippet ของตัวเอง

  // ปรับตามใช้งานจริง
  // ใช้ snippet จาก METHOD DtoBodySchema
  query_string: z

    // ปรับตามใช้งานจริง
    .string({
      message: 'ชื่อ...ต้องเป็น type: string เท่านั้น', // ปรับตามใช้งานจริง
    })
    .trim()
    .min(
      1, // ปรับตามใช้งานจริง
      'กรุณาระบุชื่อ... (ห้ามเป็นค่าว่าง)', // ปรับตามใช้งานจริง
    ),
});

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
}

// ==>>==>>== (จบ) "หน้าตาข้อมูล" ขาออก ==<<==<<==

// อย่าลืมไปลงทะเบียน ใน Controller
// อย่าลืมไปลงทะเบียน ใน Handler
