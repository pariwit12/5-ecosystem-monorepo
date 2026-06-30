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

export const GetTemplateDtoParamSchema = // ปรับตามใช้งานจริง
  z.object({
    //
    // ปรับตามใช้งานจริง
    param_uuidv7: z

      // ปรับตามใช้งานจริง
      .uuid({
        version: 'v7', // ปรับตามใช้งานจริง
        message: 'รูปแบบรหัส...ไม่ถูกต้อง', // ปรับตามใช้งานจริง
      }),
  });

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้ (ใช้ใน Backend)

export class GetTemplateDtoParam // ปรับตามใช้งานจริง
  extends createZodDto(
    GetTemplateDtoParamSchema, // ปรับตามใช้งานจริง
  ) {}

// ==========================================
// (จบ) DTO ขาเข้า (Param)
// ==========================================

// ==========================================
// DTO ขาเข้า (Query)
// ==========================================

export const GetTemplateDtoQuerySchema = // ปรับตามใช้งานจริง
  z.object({
    //
    // ปรับตามใช้งานจริง
    query_string: z

      // ปรับตามใช้งานจริง
      .string({
        message: 'ชื่อ...ต้องเป็นตัวอักษรเท่านั้น', // ปรับตามใช้งานจริง
      })
      .trim()
      .min(
        1, // ปรับตามใช้งานจริง
        'กรุณาระบุชื่อ... (ห้ามเป็นค่าว่าง)', // ปรับตามใช้งานจริง
      ),

    // ปรับตามใช้งานจริง
    query_timezone: z

      // ปรับตามใช้งานจริง
      .string({
        message: 'ชื่อ timezone ต้องเป็นตัวอักษรเท่านั้น', // ปรับตามใช้งานจริง
      })
      .trim()
      .refine(
        isValidIanaTimezone, // ปรับตามใช้งานจริง
        {
          message:
            'timezone ไม่ถูกต้องตามมาตรฐาน IANA (ตัวอย่างที่ถูกต้อง: Asia/Bangkok)', // ปรับตามใช้งานจริง
        },
      ),
  });

// แปลงเป็น DTO Class ให้ NestJS เอาไปตรวจ Pipe ได้ (ใช้ใน Backend)

export class GetTemplateDtoQuery // ปรับตามใช้งานจริง
  extends createZodDto(
    GetTemplateDtoQuerySchema, // ปรับตามใช้งานจริง
  ) {}

// ==========================================
// (จบ) DTO ขาเข้า (Query)
// ==========================================

// ==========================
// 🌟 "หน้าตาข้อมูล" ขาเข้า
// ==========================

// ปรับตามใช้งานจริง
export class GetTemplateQuery {
  constructor(
    //
    // ปรับตามใช้งานจริง
    public readonly clerkId: string,
    public readonly param: GetTemplateDtoParam, // ปรับตามใช้งานจริง
    public readonly queryFromUrl: GetTemplateDtoQuery, // ปรับตามใช้งานจริง
  ) {}
}

// ==========================
// 🌟 (จบ) "หน้าตาข้อมูล" ขาเข้า
// ==========================

// ===========================
// 🚀 "หน้าตาข้อมูล" ขาออก
// ===========================

// เขียนเอง, ใช้ Omit, ใช้ Pick (ควรเขียนเอง ตรงนี้จะได้เป็นที่รวมหน้าตาของ Response ที่เดียว ไม่ต้องไปหาต่อ)

// ปรับตามใช้งานจริง
export interface GetTemplateResponse {
  //
  // ปรับตามใช้งานจริง
  response_data_string: string;
  response_data_object: {
    data1: string;
  };
  response_data_array_object: {
    data1: string;
  }[];
}

// ===========================
// 🚀 (จบ) "หน้าตาข้อมูล" ขาออก
// ===========================

// อย่าลืมไปลงทะเบียน ใน [template].controller.ts
// อย่าลืมไปลงทะเบียน ใน get-[template].handler.ts
