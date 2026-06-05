import { z } from "zod";
import apiClient from "@/lib/axios";
import { useErrorStore } from "@/store/use-error-store";

// 🌟 import Type สำหรับรับ response และ Schema สำหรับตรวจก่อนส่ง payload
import {
  CreateOrganizationResponse,
  CreateOrganizationDtoBodySchema,
} from "@backend/modules/organizations/commands/create-organization.command";

// 🌟 แปลง Schema เป็น type (เพื่อให้ TS ช่วยตรวจได้)
export type CreateOrganizationDtoBody = z.infer<
  typeof CreateOrganizationDtoBodySchema
>;

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
export const createOrganization = async (
  body: CreateOrganizationDtoBody,
  token: string,
): Promise<CreateOrganizationResponse> => {
  // ==========================================
  // 🛡️ ด่าน payload (ก่อนยิง API)
  // ==========================================
  // 🌟 Zod ตรวจสอบความถูกต้อง
  const parsedBody = CreateOrganizationDtoBodySchema.safeParse(body);

  if (!parsedBody.success) {
    // 🌟 ดึงข้อความภาษาไทยจาก Backend (โชว์อันแรก)
    const errorMessage =
      parsedBody.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง";

    // 🌟 สั่งเปิด Global Modal ของเราเองเลย! (ไม่ต้องรอ Axios)
    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    // โยน Error เพื่อหยุดการทำงานของฟังก์ชันนี้ทันที
    throw new Error(errorMessage);
  }

  const response = await apiClient.post<CreateOrganizationResponse>(
    "/api/organizations",
    parsedBody.data,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
};
