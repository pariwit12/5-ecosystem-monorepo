import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

// ===============================
// 🌟 Import Type and Schema
// ===============================

import {
  // ปรับตามใช้งานจริง
  GetTemplateResponse, // ปรับตามใช้งานจริง
  GetTemplateDtoParamSchema, // ปรับตามใช้งานจริง
  GetTemplateDtoQuerySchema, // ปรับตามใช้งานจริง

  // ปรับตามใช้งานจริง
} from "@backend/modules/[template]/queries/get-[template].query";

// ===============================
// 🌟 (จบ) Import Type and Schema
// ===============================

// ==========================================================
// สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
// Frontend ต้องแปลงเอง เนื่องจากใช้ Runtime คนละตัวกัน แล้วค่อย export จาก .api.ts ออกไปใช้ที่อื่นต่อ

type GetTemplateDtoParam = // ปรับตามใช้งานจริง
  z.infer<
    typeof GetTemplateDtoParamSchema // ปรับตามใช้งานจริง
  >;
type GetTemplateDtoQuery = // ปรับตามใช้งานจริง
  z.infer<
    typeof GetTemplateDtoQuerySchema // ปรับตามใช้งานจริง
  >;

// ==========================================================
// (จบ) สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================

export const getTemplate = // ปรับตามใช้งานจริง
  async (
    //
    // ==============
    // To Param
    // ==============

    // ปรับตามใช้งานจริง
    valueToParam: string,

    // ==============
    // (จบ) To Param
    // ==============

    // ==============
    // To Query
    // ==============

    // ปรับตามใช้งานจริง
    valueToQueryOne: string,
    valueTOQueryTwo: string,

    // ==============
    // (จบ) To Query
    // ==============

    // =========
    // อื่นๆ
    // =========

    // ปรับตามใช้งานจริง
    token: string,
    skipErrorCodes?: string[],

    // =========
    // (จบ) อื่นๆ
    // =========
    //
  ): Promise<// ปรับตามใช้งานจริง
  GetTemplateResponse> => {
    //
    // ============================================
    // 🛡️ ประกอบร่าง payload (Param) + ตรวจ zod
    // ============================================

    // ==============================================
    // 🌟 จุดประกอบร่างข้อมูล Param + TS ตรวจ field
    // ==============================================

    const paramData: // ปรับตามใช้งานจริง
    GetTemplateDtoParam = {
      //
      // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

      // ปรับตามใช้งานจริง
      param_uuidv7: valueToParam, // ปรับตามใช้งานจริง
      param_uuidv7_optional: undefined, // ปรับตามใช้งานจริง
      param_uuidv7_nullish: undefined, // ปรับตามใช้งานจริง
      //
    };

    // ==============================================
    // 🌟 (จบ) จุดประกอบร่างข้อมูล Param + TS ตรวจ field
    // ==============================================

    // =========================
    // 🌟 ตรวจ zod (Param)
    // =========================

    const parsedParam =
      //
      GetTemplateDtoParamSchema // ปรับตามใช้งานจริง
        //
        .safeParse(paramData);

    if (!parsedParam.success) {
      //
      // ดึงข้อความภาษาไทยจาก zod ของ Backend (โชว์อันแรก)

      const errorMessage =
        parsedParam.error.issues[0]?.message ||
        "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

      // 🌟 สำหรับ Method (Non-GET) Request ให้เรียก Global Modal พร้อม throw Error
      // 🌟 สำหรับ GET Request ให้ throw Error กลับไปเฉยๆ ให้ TanStack Query จัดการต่อในชื่อ error (ไม่ต้องเรียก Global Modal)

      // ปรับตามใช้งานจริง

      // สั่งเปิด Global Modal ผ่าน Zustand (store)
      useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

      // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
      throw new Error(errorMessage);
    }

    // =========================
    // 🌟 (จบ) ตรวจ zod (Param)
    // =========================

    // ============================================
    // 🛡️ (จบ) ประกอบร่าง payload (Param) + ตรวจ zod
    // ============================================

    // =============================================
    // 🛡️ ประกอบร่าง payload (Query) + ตรวจ zod
    // =============================================

    // ==============================================
    // 🌟 จุดประกอบร่างข้อมูล Query + TS ตรวจ field
    // ==============================================

    const queryData: // ปรับตามใช้งานจริง
    GetTemplateDtoQuery = {
      //
      // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

      // ปรับตามใช้งานจริง
      query_string: valueToQueryOne,
      query_timezone: valueTOQueryTwo,
      query_string_datetime_start_time: "2026-07-06T08:00:00+07:00",
      query_string_datetime_end_time: "2026-07-06T08:00:00Z",
      query_string_hh_mm_start_time: "20:00",
      query_int: 10,
      //
    };

    // ==============================================
    // 🌟 (จบ) จุดประกอบร่างข้อมูล Query + TS ตรวจ field
    // ==============================================

    // =========================
    // 🌟 ตรวจ zod (Query)
    // =========================

    const parsedQuery =
      //
      GetTemplateDtoQuerySchema // ปรับตามใช้งานจริง
        //
        .safeParse(queryData);

    if (!parsedQuery.success) {
      //
      // ดึงข้อความภาษาไทยจาก zod ของ Backend (โชว์อันแรก)

      const errorMessage =
        parsedQuery.error.issues[0]?.message ||
        "ข้อมูลที่จะส่งผ่าน Query ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

      // 🌟 สำหรับ Method (Non-GET) Request ให้เรียก Global Modal พร้อม throw Error
      // 🌟 สำหรับ GET Request ให้ throw Error กลับไปเฉยๆ ให้ TanStack Query จัดการต่อในชื่อ error (ไม่ต้องเรียก Global Modal)

      // ปรับตามใช้งานจริง

      // สั่งเปิด Global Modal ผ่าน Zustand (store)
      useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

      // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
      throw new Error(errorMessage);
    }

    // =========================
    // 🌟 (จบ) ตรวจ zod (Query)
    // =========================

    // =============================================
    // 🛡️ (จบ) ประกอบร่าง payload (Query) + ตรวจ zod
    // =============================================

    // =================
    // API
    // =================

    const response = await apiClient.get<//
    //
    GetTemplateResponse>( // ปรับตามใช้งานจริง
      //
      `/api/template/${parsedParam.data.param_uuidv7}`, // ปรับตามใช้งานจริง

      {
        //
        // 🌟 ใส่ข้อมูล Query ตรงนี้ Axios จะแปลงเป็น ?name=...&timezone=... ให้ (ถ้าตัวไหนมีค่าเป็น undefined มันจะไม่เอาไปต่อให้เองโดยอัตโนมัติ)

        // ปรับตามใช้งานจริง
        params: parsedQuery.data,

        headers: { Authorization: `Bearer ${token}` },

        skipErrorCodes: skipErrorCodes, // ปรับตามใช้งานจริง
      },
    );

    // =================
    // (จบ) API
    // =================

    return response.data;
  };
