import apiClient from "@/lib/axios";
import { z } from "zod";

// 🌟 import Type สำหรับรับ response และ Schema สำหรับตรวจก่อนส่ง payload จาก Backend
import {
  GetWorkScheduleStaffByPlaceIdResponse,
  GetWorkScheduleStaffByPlaceIdDtoParamSchema,
} from "@backend/modules/work-schedule/staff/queries/get-work-schedule-staff-by-place-id.query";

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
// Frontend ต้องแปลงเอง เนื่องจากใช้ Runtime คนละตัวกัน แล้วค่อย export จาก .api.ts ออกไปใช้ที่อื่นต่อ
type GetWorkScheduleStaffByPlaceIdDtoParam = z.infer<
  typeof GetWorkScheduleStaffByPlaceIdDtoParamSchema
>;

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
export const getWorkScheduleStaffByPlaceId = async (
  // To Param
  placeId: string,

  // อื่น
  token: string,
  skipErrorCodes?: string[],
): Promise<GetWorkScheduleStaffByPlaceIdResponse> => {
  // ==========================================
  // 🛡️ เตรียม/ประกอบร่าง payload (Param)
  // ==========================================

  // 🌟 จุดประกอบร่างข้อมูล (ใส่ Type ให้ TS ช่วยตรวจ field)
  const paramData: GetWorkScheduleStaffByPlaceIdDtoParam = {
    // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

    place_id: placeId,
  };

  // 🌟 Zod ตรวจสอบความถูกต้อง
  const parsedParam =
    GetWorkScheduleStaffByPlaceIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก zod ของ Backend (โชว์อันแรก)
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    // 🌟 สำหรับ Method (Non-GET) Request ให้เรียก Global Modal พร้อม throw Error
    // 🌟 สำหรับ GET Request ให้ throw Error กลับไปเฉยๆ ให้ TanStack Query จัดการต่อในชื่อ error (ไม่ต้องเรียก Global Modal)

    // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetWorkScheduleStaffByPlaceIdResponse>(
    `/api/work-schedule/staff/by-place-id/${parsedParam.data.place_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes: skipErrorCodes,
    },
  );

  return response.data;
};
