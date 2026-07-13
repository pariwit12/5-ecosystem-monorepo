import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

// ===============================
// 🌟 Import Type and Schema
// ===============================

import {
  // ปรับตามใช้งานจริง
  // หาก API นี้ไม่ส่ง response กลับมา ให้ลบทิ้งได้เลย
  MethodTemplateResponse, // ปรับตามใช้งานจริง
  MethodTemplateDtoParamSchema, // ปรับตามใช้งานจริง
  MethodTemplateDtoBodySchema, // ปรับตามใช้งานจริง

  // ปรับตามใช้งานจริง
} from "@backend/modules/[template]/commands/method-[template].command";

// ===============================
// 🌟 (จบ) Import Type and Schema
// ===============================

// ==========================================================
// สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
// Frontend ต้องแปลงเอง เนื่องจากใช้ Runtime คนละตัวกัน แล้วค่อย export จาก .api.ts ออกไปใช้ที่อื่นต่อ

export type MethodTemplateDtoParam = // ปรับตามใช้งานจริง
  z.infer<
    typeof MethodTemplateDtoParamSchema // ปรับตามใช้งานจริง
  >;
export type MethodTemplateDtoBody = // ปรับตามใช้งานจริง
  z.infer<
    typeof MethodTemplateDtoBodySchema // ปรับตามใช้งานจริง
  >;

// ==========================================================
// (จบ) สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================

export const methodTemplate = // ปรับตามใช้งานจริง
  //
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

    // =============
    // To Body
    // =============

    // ปรับตามใช้งานจริง
    valueToBodyOne: string,
    valueTOBodyTwo: string,

    // =============
    // (จบ) To Body
    // =============

    // =========
    // อื่นๆ
    // =========

    // ปรับตามใช้งานจริง
    token: string,
    skipErrorCodes?: string[],

    // =========
    // (จบ) อื่นๆ
    // =========

    // หาก API นี้ไม่ส่ง response กลับมา ให้ใส่ <void> แทน <MethodTemplateResponse>
    // ): Promise<void> => {

    // ปรับตามใช้งานจริง
  ): Promise<// ปรับตามใช้งานจริง
  MethodTemplateResponse> => {
    //
    // ============================================
    // 🛡️ ประกอบร่าง payload (Param) + ตรวจ zod
    // ============================================

    // ==============================================
    // 🌟 จุดประกอบร่างข้อมูล Param + TS ตรวจ field
    // ==============================================

    const paramData: // ปรับตามใช้งานจริง
    MethodTemplateDtoParam = {
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
      MethodTemplateDtoParamSchema // ปรับตามใช้งานจริง
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

    // ============================================
    // 🛡️ ประกอบร่าง payload (Body) + ตรวจ zod
    // ============================================

    // ==============================================
    // 🌟 จุดประกอบร่างข้อมูล Body + TS ตรวจ field
    // ==============================================

    const bodyData: // ปรับตามใช้งานจริง
    MethodTemplateDtoBody = {
      //
      // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

      // ปรับตามใช้งานจริง
      body_string: valueToBodyOne, // ปรับตามใช้งานจริง
      body_timezone: valueTOBodyTwo, // ปรับตามใช้งานจริง
      body_string_datetime_start_time: "2026-07-06T08:00:00+07:00", // ปรับตามใช้งานจริง
      body_string_datetime_end_time: "2026-07-06T08:00:00Z", // ปรับตามใช้งานจริง
      body_string_hh_mm_start_time: "20:30", // ปรับตามใช้งานจริง
      body_int: 1, // ปรับตามใช้งานจริง
      //
    };

    // ==============================================
    // 🌟 (จบ) จุดประกอบร่างข้อมูล Body + TS ตรวจ field
    // ==============================================

    // =========================
    // 🌟 ตรวจ zod (Body)
    // =========================

    const parsedBody =
      //
      MethodTemplateDtoBodySchema // ปรับตามใช้งานจริง
        //
        .safeParse(bodyData);

    if (!parsedBody.success) {
      //
      // ดึงข้อความภาษาไทยจาก Backend (โชว์อันแรก)

      const errorMessage =
        parsedBody.error.issues[0]?.message ||
        "ข้อมูลที่จะส่งผ่าน Body ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

      // 🌟 สำหรับ Method (Non-GET) Request ให้เรียก Global Modal พร้อม throw Error
      // 🌟 สำหรับ GET Request ให้ throw Error กลับไปเฉยๆ ให้ TanStack Query จัดการต่อในชื่อ error (ไม่ต้องเรียก Global Modal)

      // ปรับตามใช้งานจริง

      // สั่งเปิด Global Modal ผ่าน Zustand (store)
      useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

      // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
      throw new Error(errorMessage);
    }

    // =========================
    // 🌟 (จบ) ตรวจ zod (Body)
    // =========================

    // ============================================
    // 🛡️ (จบ) ประกอบร่าง payload (Body) + ตรวจ zod
    // ============================================

    // =================
    // API
    // =================

    // ปรับตามใช้งานจริง
    const response = // หากไม่คืนค่า ลบตรงนี้ออกได้เลย
      //
      await apiClient.post<// ปรับตามใช้งานจริง
      //
      // void>(
      MethodTemplateResponse>( // ปรับตามใช้งานจริง
        //
        `/api/template/${parsedParam.data.param_uuidv7}`, // ปรับตามใช้งานจริง

        // ปรับตามใช้งานจริง
        parsedBody.data,
        // undefined, // 👈 ใช้ undefined หรือ null เพื่อบอกว่าไม่มี Body (ห้ามลบออกไปดื้อๆ)

        {
          headers: { Authorization: `Bearer ${token}` },

          skipErrorCodes: skipErrorCodes, // ปรับตามใช้งานจริง
        },
      );

    // =================
    // (จบ) API
    // =================

    // ปรับตามใช้งานจริง
    return response.data;
    // return ;
  };
