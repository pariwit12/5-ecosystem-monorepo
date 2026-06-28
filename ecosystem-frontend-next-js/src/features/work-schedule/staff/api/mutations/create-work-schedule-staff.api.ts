import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

// 🌟 import Type สำหรับรับ response และ Schema สำหรับตรวจก่อนส่ง payload
import {
  CreateWorkScheduleStaffDtoParamSchema,
  CreateWorkScheduleStaffDtoBodySchema,
} from "@backend/modules/work-schedule/staff/commands/create-work-schedule-staff.command";

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
// Frontend ต้องแปลงเอง เนื่องจากใช้ Runtime คนละตัวกัน แล้วค่อย export จาก .api.ts ออกไปใช้ที่อื่นต่อ
export type CreateWorkScheduleStaffDtoParam = z.infer<
  typeof CreateWorkScheduleStaffDtoParamSchema
>;
export type CreateWorkScheduleStaffDtoBody = z.infer<
  typeof CreateWorkScheduleStaffDtoBodySchema
>;

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
export const createWorkScheduleStaff = async (
  // To Param
  placeId: string,

  // To Body
  name: string,

  // อื่นๆ
  token: string,
  skipErrorCodes?: string[],
): Promise<void> => {
  // ==========================================
  // 🛡️ เตรียม/ประกอบร่าง payload (Param)
  // ==========================================

  // 🌟 จุดประกอบร่างข้อมูล (ใส่ Type ให้ TS ช่วยตรวจ field)
  const paramData: CreateWorkScheduleStaffDtoParam = {
    // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

    place_id: placeId,
  };

  // Zod ตรวจสอบความถูกต้อง
  const parsedParam =
    CreateWorkScheduleStaffDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
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

  // ==========================================
  // 🛡️ เตรียม/ประกอบร่าง payload (Body)
  // ==========================================

  // 🌟 จุดประกอบร่างข้อมูล (ใส่ Type ให้ TS ช่วยตรวจ field)
  const bodyData: CreateWorkScheduleStaffDtoBody = {
    // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

    name: name,
  };

  // Zod ตรวจสอบความถูกต้อง
  const parsedBody = CreateWorkScheduleStaffDtoBodySchema.safeParse(bodyData);

  if (!parsedBody.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก Backend (โชว์อันแรก)
    const errorMessage =
      parsedBody.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Body ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    // 🌟 สำหรับ Method (Non-GET) Request ให้เรียก Global Modal พร้อม throw Error
    // 🌟 สำหรับ GET Request ให้ throw Error กลับไปเฉยๆ ให้ TanStack Query จัดการต่อในชื่อ error (ไม่ต้องเรียก Global Modal)

    // สั่งเปิด Global Modal ผ่าน Zustand (store)
    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);
    // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
    throw new Error(errorMessage);
  }

  await apiClient.post<void>(
    `/api/work-schedule/staff/${parsedParam.data.place_id}`,
    parsedBody.data,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes: skipErrorCodes,
    },
  );

  return;
};
