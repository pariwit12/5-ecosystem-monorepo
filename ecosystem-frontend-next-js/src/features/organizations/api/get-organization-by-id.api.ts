import { z } from "zod";
import apiClient from "@/lib/axios";
import { useErrorStore } from "@/store/use-error-store";

// 🌟 import Type สำหรับรับ response และ Schema สำหรับตรวจก่อนส่ง payload
import {
  GetOrganizationByIdResponse,
  GetOrganizationByIdDtoParamSchema,
} from "@backend/modules/organizations/queries/get-organization-by-id.query";

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
type GetOrganizationByIdDtoParam = z.infer<
  typeof GetOrganizationByIdDtoParamSchema
>;

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
export const getOrganizationById = async (
  orgId: string,
  token: string,
  skipErrorCodes?: string[],
): Promise<GetOrganizationByIdResponse> => {
  // ==========================================
  // 🛡️ ด่าน payload (ก่อนยิง API)
  // ==========================================
  // 🌟 จุดประกอบร่างข้อมูล ของ useQuery
  const paramData: GetOrganizationByIdDtoParam = {
    organization_id: orgId, // หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง
  };

  // 🌟 Zod ตรวจสอบความถูกต้อง
  const parsedParam = GetOrganizationByIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก Backend (โชว์อันแรก)
    const errorMessage =
      parsedParam.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";

    // 🌟 สั่งเปิด Global Modal ของเราเองเลย! (ไม่ต้องรอ Axios)
    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetOrganizationByIdResponse>(
    `/api/organizations/${parsedParam.data.organization_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes: skipErrorCodes,
    },
  );

  return response.data;
};
