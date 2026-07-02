import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

// ===============================
// 🌟 Import Type and Schema
// ===============================

import {
  GetWorkSchedulePositionsByPlaceIdResponse,
  GetWorkSchedulePositionsByPlaceIdDtoParamSchema,
} from "@backend/modules/work-schedule/position/queries/get-work-schedule-positions-by-place-id.query";

// ===============================
// 🌟 (จบ) Import Type and Schema
// ===============================

// ==========================================================
// สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
// Frontend ต้องแปลงเอง เนื่องจากใช้ Runtime คนละตัวกัน แล้วค่อย export จาก .api.ts ออกไปใช้ที่อื่นต่อ

type GetWorkSchedulePositionsByPlaceIdDtoParam = z.infer<
  typeof GetWorkSchedulePositionsByPlaceIdDtoParamSchema
>;

// ==========================================================
// (จบ) สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================

export const getWorkSchedulePositionsByPlaceId = async (
  //
  // ==============
  // To Param
  // ==============

  place_id: string,

  // ==============
  // (จบ) To Param
  // ==============

  // =========
  // อื่นๆ
  // =========

  token: string,
  skipErrorCodes?: string[],

  // =========
  // (จบ) อื่นๆ
  // =========
  //
): Promise<GetWorkSchedulePositionsByPlaceIdResponse> => {
  //
  // ============================================
  // 🛡️ ประกอบร่าง payload (Param) + ตรวจ zod
  // ============================================

  // ==============================================
  // 🌟 จุดประกอบร่างข้อมูล Param + TS ตรวจ field
  // ==============================================

  const paramData: GetWorkSchedulePositionsByPlaceIdDtoParam = {
    place_id: place_id,
  };

  // ==============================================
  // 🌟 (จบ) จุดประกอบร่างข้อมูล Param + TS ตรวจ field
  // ==============================================

  // =========================
  // 🌟 ตรวจ zod (Param)
  // =========================

  const parsedParam =
    GetWorkSchedulePositionsByPlaceIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    //
    // ดึงข้อความภาษาไทยจาก zod ของ Backend (โชว์อันแรก)

    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    // 🌟 สำหรับ Method (Non-GET) Request ให้เรียก Global Modal พร้อม throw Error
    // 🌟 สำหรับ GET Request ให้ throw Error กลับไปเฉยๆ ให้ TanStack Query จัดการต่อในชื่อ error (ไม่ต้องเรียก Global Modal)

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

  // =================
  // API
  // =================

  const response =
    await apiClient.get<GetWorkSchedulePositionsByPlaceIdResponse>(
      `/api/work-schedule/position/by-place-id/${parsedParam.data.place_id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        skipErrorCodes: skipErrorCodes,
      },
    );

  // =================
  // (จบ) API
  // =================

  return response.data;
};
