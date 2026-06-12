import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

// 🌟 import Type สำหรับรับ response และ Schema สำหรับตรวจก่อนส่ง payload จาก Backend
import {
  // ปรับตามใช้งานจริง
  GetTemplateResponse,
  GetTemplateDtoParamSchema,
  GetTemplateDtoQuerySchema,

  // ปรับตามใช้งานจริง
} from "@backend/modules/[template]/queries/get-[template].query";

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

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
// ปรับตามใช้งานจริง
export const getTemplate = async (
  // To Param
  // ปรับตามใช้งานจริง
  valueToParam: string,

  // To Query
  // ปรับตามใช้งานจริง
  valueToQueryOne: string,
  valueTOQueryTwo: string,

  // อื่น
  // ปรับตามใช้งานจริง
  token: string,
  skipErrorCodes?: string[],

  // ปรับตามใช้งานจริง
): Promise<GetTemplateResponse> => {
  // ==========================================
  // 🛡️ เตรียม/ประกอบร่าง payload (Param)
  // ==========================================

  // 🌟 จุดประกอบร่างข้อมูล (ใส่ Type ให้ TS ช่วยตรวจ field)

  // ปรับตามใช้งานจริง
  const paramData: GetTemplateDtoParam = {
    // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

    // ปรับตามใช้งานจริง
    organization_id: valueToParam,
  };

  // 🌟 Zod ตรวจสอบความถูกต้อง
  const parsedParam = GetTemplateDtoParamSchema.safeParse(paramData); // ปรับตามใช้งานจริง

  if (!parsedParam.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก zod ของ Backend (โชว์อันแรก)
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    // 🌟 สำหรับ Method (Non-GET) Request ให้เรียก Global Modal พร้อม throw Error
    // 🌟 สำหรับ GET Request ให้ throw Error กลับไปเฉยๆ ให้ TanStack Query จัดการต่อในชื่อ error (ไม่ต้องเรียก Global Modal)

    // ปรับตามใช้งานจริง

    // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
    throw new Error(errorMessage);
  }

  // ==========================================
  // 🛡️ เตรียม/ประกอบร่าง payload (Query)
  // ==========================================

  // 🌟 จุดประกอบร่างข้อมูล (ใส่ Type ให้ TS ช่วยตรวจ field)

  // ปรับตามใช้งานจริง
  const queryData: GetTemplateDtoQuery = {
    // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

    // ปรับตามใช้งานจริง
    name: valueToQueryOne,
    timezone: valueTOQueryTwo,
  };

  // 🌟 Zod ตรวจสอบความถูกต้อง
  const parsedQuery = GetTemplateDtoQuerySchema.safeParse(queryData); // ปรับตามใช้งานจริง

  if (!parsedQuery.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก zod ของ Backend (โชว์อันแรก)
    const errorMessage =
      parsedQuery.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Query ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    // 🌟 สำหรับ Method (Non-GET) Request ให้เรียก Global Modal พร้อม throw Error
    // 🌟 สำหรับ GET Request ให้ throw Error กลับไปเฉยๆ ให้ TanStack Query จัดการต่อในชื่อ error (ไม่ต้องเรียก Global Modal)

    // ปรับตามใช้งานจริง

    // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetTemplateResponse>( // ปรับตามใช้งานจริง
    `/api/template/${parsedParam.data.organization_id}`, // ปรับตามใช้งานจริง
    {
      // 🌟 ใส่ข้อมูล Query ตรงนี้ Axios จะแปลงเป็น ?name=...&timezone=... ให้ (ถ้าตัวไหนมีค่าเป็น undefined มันจะไม่เอาไปต่อให้เองโดยอัตโนมัติ)
      params: parsedQuery.data,
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes: skipErrorCodes, // ปรับตามใช้งานจริง
    },
  );

  return response.data;
};
