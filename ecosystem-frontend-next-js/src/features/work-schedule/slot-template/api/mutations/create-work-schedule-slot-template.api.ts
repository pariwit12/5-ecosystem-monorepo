import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

// ===============================
// 🌟 Import Type and Schema
// ===============================

import {
  CreateWorkScheduleSlotTemplateDtoParamSchema,
  CreateWorkScheduleSlotTemplateDtoBodySchema,
} from "@backend/modules/work-schedule/slot-template/commands/create-work-schedule-slot-template.command";

// ===============================
// 🌟 (จบ) Import Type and Schema
// ===============================

// ==========================================================
// สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

export type CreateWorkScheduleSlotTemplateDtoParam = z.infer<
  typeof CreateWorkScheduleSlotTemplateDtoParamSchema
>;
export type CreateWorkScheduleSlotTemplateDtoBody = z.infer<
  typeof CreateWorkScheduleSlotTemplateDtoBodySchema
>;

// ==========================================================
// (จบ) สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend)
// ==========================================================

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================

export const createWorkScheduleSlotTemplate = async (
  //
  // ==============
  // To Param
  // ==============

  positionId: string,

  // ==============
  // (จบ) To Param
  // ==============

  // =============
  // To Body
  // =============

  name: string,
  startTime: string,
  durationMinute: number,
  quantity: number,

  // =============
  // (จบ) To Body
  // =============

  // =========
  // อื่นๆ
  // =========

  token: string,
  skipErrorCodes?: string[],

  // =========
  // (จบ) อื่นๆ
  // =========
): Promise<void> => {
  //
  // ============================================
  // 🛡️ ประกอบร่าง payload (Param) + ตรวจ zod
  // ============================================

  // ==============================================
  // 🌟 จุดประกอบร่างข้อมูล Param + TS ตรวจ field
  // ==============================================

  const paramData: CreateWorkScheduleSlotTemplateDtoParam = {
    work_schedule_position_id: positionId,
  };

  // ==============================================
  // 🌟 (จบ) จุดประกอบร่างข้อมูล Param + TS ตรวจ field
  // ==============================================

  // =========================
  // 🌟 ตรวจ zod (Param)
  // =========================

  const parsedParam =
    CreateWorkScheduleSlotTemplateDtoParamSchema.safeParse(paramData);

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

  // ============================================
  // 🛡️ ประกอบร่าง payload (Body) + ตรวจ zod
  // ============================================

  // ==============================================
  // 🌟 จุดประกอบร่างข้อมูล Body + TS ตรวจ field
  // ==============================================

  const bodyData: CreateWorkScheduleSlotTemplateDtoBody = {
    name: name,
    start_time: startTime,
    duration_minute: durationMinute,
    quantity: quantity,
  };

  // ==============================================
  // 🌟 (จบ) จุดประกอบร่างข้อมูล Body + TS ตรวจ field
  // ==============================================

  // =========================
  // 🌟 ตรวจ zod (Body)
  // =========================

  const parsedBody =
    CreateWorkScheduleSlotTemplateDtoBodySchema.safeParse(bodyData);

  if (!parsedBody.success) {
    const errorMessage =
      parsedBody.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Body ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

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

  await apiClient.post<void>(
    `/api/work-schedule/slot-template/${parsedParam.data.work_schedule_position_id}`,

    parsedBody.data,

    {
      headers: { Authorization: `Bearer ${token}` },

      skipErrorCodes: skipErrorCodes,
    },
  );

  // =================
  // (จบ) API
  // =================

  return;
};
