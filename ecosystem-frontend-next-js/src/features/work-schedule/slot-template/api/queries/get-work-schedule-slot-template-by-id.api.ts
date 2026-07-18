import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

// ===============================
// 🌟 Import Type and Schema
// ===============================

import {
  GetWorkScheduleSlotTemplateByIdResponse,
  GetWorkScheduleSlotTemplateByIdDtoParamSchema,
} from "@backend/modules/work-schedule/slot-template/queries/get-work-schedule-slot-template-by-id.query";

// ===============================
// 🌟 (จบ) Import Type and Schema
// ===============================

// ==========================================================
// สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

type GetWorkScheduleSlotTemplateByIdDtoParam = z.infer<
  typeof GetWorkScheduleSlotTemplateByIdDtoParamSchema
>;

// ==========================================================
// (จบ) สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================

export const getWorkScheduleSlotTemplateById = async (
  //
  // ==============
  // To Param
  // ==============

  slotTemplateId: string,

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
): Promise<GetWorkScheduleSlotTemplateByIdResponse> => {
  //
  // ============================================
  // 🛡️ ประกอบร่าง payload (Param) + ตรวจ zod
  // ============================================

  // ==============================================
  // 🌟 จุดประกอบร่างข้อมูล Param + TS ตรวจ field
  // ==============================================

  const paramData: GetWorkScheduleSlotTemplateByIdDtoParam = {
    work_schedule_slot_template_id: slotTemplateId,
  };

  // ==============================================
  // 🌟 (จบ) จุดประกอบร่างข้อมูล Param + TS ตรวจ field
  // ==============================================

  // =========================
  // 🌟 ตรวจ zod (Param)
  // =========================

  const parsedParam =
    GetWorkScheduleSlotTemplateByIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

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

  const response = await apiClient.get<GetWorkScheduleSlotTemplateByIdResponse>(
    `/api/work-schedule/slot-template/by-id/${parsedParam.data.work_schedule_slot_template_id}`,

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
