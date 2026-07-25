import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

// ==>>==>>== Import Type and Schema ==<<==<<==

import {
  // ปรับตามใช้งานจริง
  // หาก API นี้ไม่ส่ง response กลับมา ให้ลบทิ้งได้เลย
  MethodManyAvailableOtherProgramOtherFeatureResponse,
  MethodManyAvailableOtherProgramOtherFeatureDtoParamSchema,
  MethodManyAvailableOtherProgramOtherFeatureDtoBodySchema,

  // ปรับตามใช้งานจริง
} from "@backend/modules/[program]/[feature]/commands/[method-many]-[available_null]-[other-program_null]-[other-feature_null].command";

// ==>>==>>== (จบ) Import Type and Schema ==<<==<<==

// ==>>==>>== สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend) ==<<==<<==

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
// Frontend ต้องแปลงเอง เนื่องจากใช้ Runtime คนละตัวกัน แล้วค่อย export จาก .api.ts ออกไปใช้ที่อื่นต่อ

// ปรับตามใช้งานจริง
export type MethodManyAvailableOtherProgramOtherFeatureDtoParam = z.infer<
  // ปรับตามใช้งานจริง
  typeof MethodManyAvailableOtherProgramOtherFeatureDtoParamSchema
>;

// ปรับตามใช้งานจริง
export type MethodManyAvailableOtherProgramOtherFeatureDtoBody = z.infer<
  // ปรับตามใช้งานจริง
  typeof MethodManyAvailableOtherProgramOtherFeatureDtoBodySchema
>;

// ==>>==>>== (จบ) สร้าง Type จาก Backend Schema (export ไว้ใช้ใน Frontend) ==<<==<<==

// ==>>==>>== 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้) ==<<==<<==

// ปรับตามใช้งานจริง
export const methodManyAvailableOtherProgramOtherFeature = async (
  //
  // ==>>==>>== To Param ==<<==<<==

  // ปรับตามใช้งานจริง
  valueToParamString: string,

  // ==>>==>>== (จบ) To Param ==<<==<<==

  // ==>>==>>== To Body ==<<==<<==

  // ปรับตามใช้งานจริง
  valueToBodyOne: string,
  valueTOBodyTwo: string,
  slots: {
    name: string;
    actual_start_time: string;
    actual_end_time: string;
  }[],

  // ==>>==>>== (จบ) To Body ==<<==<<==

  // ==>>==>>== อื่นๆ ==<<==<<==

  // ปรับตามใช้งานจริง
  token: string,
  skipErrorCodes?: readonly string[],

  // ==>>==>>== (จบ) อื่นๆ ==<<==<<==
): Promise<//
// ปรับตามใช้งานจริง
// หากไม่คืนค่า ให้ใส่เป็น void แทน
MethodManyAvailableOtherProgramOtherFeatureResponse> => {
  //
  // ==>>==>>== 🛡️ ประกอบร่าง payload (Param) + ตรวจ zod ==<<==<<==

  // ==>>==>>== 🌟 จุดประกอบร่างข้อมูล Param + TS ตรวจ field ==<<==<<==

  // ปรับตามใช้งานจริง
  const paramData: MethodManyAvailableOtherProgramOtherFeatureDtoParam = {
    //
    // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

    // ปรับตามใช้งานจริง
    param_uuidv7: valueToParamString,
  };

  // ==>>==>>== 🌟 (จบ) จุดประกอบร่างข้อมูล Param + TS ตรวจ field ==<<==<<==

  // ==>>==>>== 🌟 ตรวจ zod (Param) ==<<==<<==

  const parsedParam =
    // ปรับตามใช้งานจริง
    MethodManyAvailableOtherProgramOtherFeatureDtoParamSchema.safeParse(
      paramData,
    );

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

  // ==>>==>>== 🌟 (จบ) ตรวจ zod (Param) ==<<==<<==

  // ==>>==>>== 🛡️ (จบ) ประกอบร่าง payload (Param) + ตรวจ zod ==<<==<<==

  // ==>>==>>== 🛡️ ประกอบร่าง payload (Body) + ตรวจ zod ==<<==<<==

  // ==>>==>>== 🌟 จุดประกอบร่างข้อมูล Body + TS ตรวจ field ==<<==<<==

  // ปรับตามใช้งานจริง
  const bodyData: MethodManyAvailableOtherProgramOtherFeatureDtoBody = {
    //
    // field หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง

    // ปรับตามใช้งานจริง
    body_string: valueToBodyOne,
    body_timezone: valueTOBodyTwo,
    body_string_datetime_start_time: "2026-07-06T08:00:00+07:00",
    body_string_datetime_end_time: "2026-07-06T08:00:00Z",
    body_string_hh_mm_start_time: "20:30",
    body_int: 1,
    body_array: slots,
  };

  // ==>>==>>== 🌟 (จบ) จุดประกอบร่างข้อมูล Body + TS ตรวจ field ==<<==<<==

  // ==>>==>>== 🌟 ตรวจ zod (Body) ==<<==<<==

  const parsedBody =
    // ปรับตามใช้งานจริง
    MethodManyAvailableOtherProgramOtherFeatureDtoBodySchema.safeParse(
      bodyData,
    );

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

  // ==>>==>>== 🌟 (จบ) ตรวจ zod (Body) ==<<==<<==

  // ==>>==>>== 🛡️ (จบ) ประกอบร่าง payload (Body) + ตรวจ zod ==<<==<<==

  // ==>>==>>== API ==<<==<<==

  // ปรับตามใช้งานจริง
  // หากไม่คืนค่า ลบตรงนี้ออกได้เลย
  const response =
    //
    // ปรับตามใช้งานจริง
    await apiClient.post<//
    //
    // ปรับตามใช้งานจริง
    // void>(
    MethodManyAvailableOtherProgramOtherFeatureResponse>(
      //
      // ปรับตามใช้งานจริง
      `/api/program/feature/path/${parsedParam.data.param_uuidv7}`,

      // ปรับตามใช้งานจริง
      // undefined, // 👈 ใช้ undefined หรือ null เพื่อบอกว่าไม่มี Body (ห้ามลบออกไปดื้อๆ)
      parsedBody.data,

      {
        headers: { Authorization: `Bearer ${token}` },

        // ปรับตามใช้งานจริง
        skipErrorCodes: skipErrorCodes,
      },
    );

  // ==>>==>>== (จบ) API ==<<==<<==

  // ปรับตามใช้งานจริง
  // return ;
  return response.data;
};
