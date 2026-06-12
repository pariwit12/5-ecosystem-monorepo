import { z } from "zod";
import apiClient from "@/lib/axios";
import { useErrorStore } from "@/store/use-error-store";

// 🌟 import Type สำหรับรับ response และ Schema สำหรับตรวจก่อนส่ง payload
import {
  CreateWorkSchedulePlaceDtoParamSchema,
  CreateWorkSchedulePlaceDtoBodySchema,
} from "@backend/modules/work-schedule/places/commands/create-work-schedule-place.command";

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
export type CreateWorkSchedulePlaceDtoParam = z.infer<
  typeof CreateWorkSchedulePlaceDtoParamSchema
>;

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
export type CreateWorkSchedulePlaceDtoBody = z.infer<
  typeof CreateWorkSchedulePlaceDtoBodySchema
>;

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
export const createWorkSchedulePlace = async (
  orgId: string,
  token: string,
  body: CreateWorkSchedulePlaceDtoBody,
): Promise<void> => {
  // ==========================================
  // 🛡️ ด่าน payload (ก่อนยิง API)
  // ==========================================
  // 🌟 จุดประกอบร่างข้อมูล ของ useQuery
  const paramData: CreateWorkSchedulePlaceDtoParam = {
    organization_id: orgId, // หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง
  };

  // 🌟 Zod ตรวจสอบความถูกต้อง
  const parsedParam =
    CreateWorkSchedulePlaceDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก Backend (โชว์อันแรก)
    const errorMessage =
      parsedParam.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";

    // 🌟 สั่งเปิด Global Modal ของเราเองเลย! (ไม่ต้องรอ Axios)
    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
    throw new Error(errorMessage);
  }

  // ==========================================
  // 🛡️ ด่าน payload (ก่อนยิง API)
  // ==========================================
  // 🌟 Zod ตรวจสอบความถูกต้อง
  const parsedBody = CreateWorkSchedulePlaceDtoBodySchema.safeParse(body);

  if (!parsedBody.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก Backend (โชว์อันแรก)
    const errorMessage =
      parsedBody.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";

    // 🌟 สั่งเปิด Global Modal ของเราเองเลย! (ไม่ต้องรอ Axios)
    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
    throw new Error(errorMessage);
  }

  await apiClient.post<void>(
    `/api/work-schedule/places/${parsedParam.data.organization_id}`,
    parsedBody.data,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return;
};
