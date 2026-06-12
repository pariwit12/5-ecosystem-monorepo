import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

// 🌟 import Type สำหรับรับ response และ Schema สำหรับตรวจก่อนส่ง payload
import {
  // ปรับตามใช้งานจริง
  MethodTemplateResponse, // หาก API นี้ไม่ส่ง response กลับมา ให้ลบทิ้งได้เลย
  MethodTemplateDtoParamSchema,
  MethodTemplateDtoBodySchema,

  // ปรับตามใช้งานจริง
} from "@backend/modules/[template]/commands/method-[template].command";

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

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
// ปรับตามใช้งานจริง
export const methodTemplate = async (
  // To Param
  // ปรับตามใช้งานจริง
  valueToParam: string,

  // To Body
  // ปรับตามใช้งานจริง
  valueToBodyOne: string,
  valueTOBodyTwo: string,

  // อื่นๆ
  // ปรับตามใช้งานจริง
  token: string,
  skipErrorCodes?: string[],

  // หาก API นี้ไม่ส่ง response กลับมา ให้ใส่ <void> แทน <MethodTemplateResponse>
  // ): Promise<void> => {
  // ปรับตามใช้งานจริง
): Promise<MethodTemplateResponse> => {
  // ==========================================
  // 🛡️ เตรียม/ประกอบร่าง payload (Param)
  // ==========================================

  // 🌟 จุดประกอบร่างข้อมูล (ใส่ Type ให้ TS ช่วยตรวจ field)

  // ปรับตามใช้งานจริง
  const paramData: MethodTemplateDtoParam = {
    // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

    // ปรับตามใช้งานจริง
    organization_id: valueToParam,
  };

  // Zod ตรวจสอบความถูกต้อง
  const parsedParam = MethodTemplateDtoParamSchema.safeParse(paramData); // ปรับตามใช้งานจริง

  if (!parsedParam.success) {
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

  // ==========================================
  // 🛡️ เตรียม/ประกอบร่าง payload (Body)
  // ==========================================

  // 🌟 จุดประกอบร่างข้อมูล (ใส่ Type ให้ TS ช่วยตรวจ field)

  // ปรับตามใช้งานจริง
  const bodyData: MethodTemplateDtoBody = {
    // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

    // ปรับตามใช้งานจริง
    name: valueToBodyOne,
    timezone: valueTOBodyTwo,
  };

  // Zod ตรวจสอบความถูกต้อง
  const parsedBody = MethodTemplateDtoBodySchema.safeParse(bodyData); // ปรับตามใช้งานจริง

  if (!parsedBody.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก Backend (โชว์อันแรก)
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

  // ปรับตามใช้งานจริง
  // await apiClient.post<void>(
  const response = await apiClient.post<MethodTemplateResponse>( // ปรับตามใช้งานจริง
    `/api/work-schedule/places/${parsedParam.data.organization_id}`, // ปรับตามใช้งานจริง
    parsedBody.data, // ปรับตามใช้งานจริง
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes: skipErrorCodes, // ปรับตามใช้งานจริง
    },
  );

  // ปรับตามใช้งานจริง
  // return ;
  return response.data;
};
