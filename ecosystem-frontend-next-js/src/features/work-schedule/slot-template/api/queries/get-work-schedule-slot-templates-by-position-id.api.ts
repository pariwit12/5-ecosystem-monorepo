import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

// ===============================
// 🌟 Import Type and Schema
// ===============================

import {
  GetWorkScheduleSlotTemplatesByPositionIdResponse,
  GetWorkScheduleSlotTemplatesByPositionIdDtoParamSchema,
} from "@backend/modules/work-schedule/slot-template/queries/get-work-schedule-slot-templates-by-position-id.query";

// ===============================
// 🌟 (จบ) Import Type and Schema
// ===============================

// ==========================================================
// สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

type GetWorkScheduleSlotTemplatesByPositionIdDtoParam = z.infer<
  typeof GetWorkScheduleSlotTemplatesByPositionIdDtoParamSchema
>;

// ==========================================================
// (จบ) สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================

export const getWorkScheduleSlotTemplatesByPositionId = async (
  //
  // ==============
  // To Param
  // ==============

  positionId: string,

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
): Promise<GetWorkScheduleSlotTemplatesByPositionIdResponse> => {
  //
  // ============================================
  // 🛡️ ประกอบร่าง payload (Param) + ตรวจ zod
  // ============================================

  // ==============================================
  // 🌟 จุดประกอบร่างข้อมูล Param + TS ตรวจ field
  // ==============================================

  const paramData: GetWorkScheduleSlotTemplatesByPositionIdDtoParam = {
    work_schedule_position_id: positionId,
  };

  // ==============================================
  // 🌟 (จบ) จุดประกอบร่างข้อมูล Param + TS ตรวจ field
  // ==============================================

  // =========================
  // 🌟 ตรวจ zod (Param)
  // =========================

  const parsedParam =
    GetWorkScheduleSlotTemplatesByPositionIdDtoParamSchema.safeParse(paramData);

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

  const response =
    await apiClient.get<GetWorkScheduleSlotTemplatesByPositionIdResponse>(
      `/api/work-schedule/slot-template/by-position-id/${parsedParam.data.work_schedule_position_id}`,
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
