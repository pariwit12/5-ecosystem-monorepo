import { z } from "zod";
import apiClient from "@/lib/axios";
import { useErrorStore } from "@/store/use-error-store";

// 🌟 import Type สำหรับรับ response และ Schema สำหรับตรวจก่อนส่ง payload
import {
  UpdateOrganizationByIdResponse,
  UpdateOrganizationByIdDtoParamSchema,
  UpdateOrganizationByIdDtoBodySchema,
} from "@backend/modules/organizations/commands/update-organization-by-id.command";

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
export type UpdateOrganizationByIdDtoParam = z.infer<
  typeof UpdateOrganizationByIdDtoParamSchema
>;

export type UpdateOrganizationByIdDtoBody = z.infer<
  typeof UpdateOrganizationByIdDtoBodySchema
>;

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
export const updateOrganizationById = async (
  token: string,
  orgId: string,
  body: UpdateOrganizationByIdDtoBody,
): Promise<UpdateOrganizationByIdResponse> => {
  // ==========================================
  // 🛡️ ด่าน payload (ก่อนยิง API)
  // ==========================================
  // 🌟 จุดประกอบร่างข้อมูล ของ useQuery
  const paramData: UpdateOrganizationByIdDtoParam = {
    organization_id: orgId, // หน้าบ้านต้องตรงกับหลังบ้าน ไม่งั้นแดง
  };

  // 🌟 Zod ตรวจสอบความถูกต้อง
  const parsedParam = UpdateOrganizationByIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก Backend (โชว์อันแรก)
    const errorMessage =
      parsedParam.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";

    // 🌟 สั่งเปิด Global Modal ของเราเองเลย! (ไม่ต้องรอ Axios)
    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
    throw new Error(errorMessage);
  }

  // 🌟 Zod ตรวจสอบความถูกต้อง
  const parsedBody = UpdateOrganizationByIdDtoBodySchema.safeParse(body);

  if (!parsedBody.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก Backend (โชว์อันแรก)
    const errorMessage =
      parsedBody.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";

    // 🌟 สั่งเปิด Global Modal ของเราเองเลย! (ไม่ต้องรอ Axios)
    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
    throw new Error(errorMessage);
  }

  const response = await apiClient.patch<UpdateOrganizationByIdResponse>(
    `/api/organizations/${parsedParam.data.organization_id}`,
    parsedBody.data,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
};
