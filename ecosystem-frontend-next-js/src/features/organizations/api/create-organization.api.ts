import { z } from "zod";
import apiClient from "@/lib/axios";

import type {
  CreateOrganizationDtoBody,
  CreateOrganizationResponse,
} from "@backend/modules/organizations/commands/create-organization.command";

// 🌟 1. สร้าง Type Helper (แนะนำให้ก๊อปอันนี้ไปสร้างไฟล์ src/types/zod.type.ts ไว้ใช้ยาวๆ เลยครับ)
export type StrictZodShape<T> = {
  [K in keyof T]: z.ZodType<T[K]>;
};

// ==========================================
// 🚀 1. ด่านขาออก Payload/Request (+/- Transformation)
// ==========================================
const createOrganizationPayloadBodySchema = z.object({
  name: z.string(),
  // กรณีต้องการเติมข้อมูลหรือแปลงข้อมูลก่อนส่ง
  // .transform((data) => ({
  //   ...data,
  //   type: "DENTAL_CLINIC", // 🌟 แปลงร่าง/เติมข้อมูลให้สอดคล้องกับระบบ Toothcraft โดยที่หน้า UI ไม่ต้องเหนื่อย
  //   clientTimestamp: new Date().toISOString(),
  // }));
} satisfies StrictZodShape<CreateOrganizationDtoBody>);

// ==========================================
// 🛡️ 2. ด่านขาเข้า (Response Validation)
// ==========================================
// ถ้าผ่านมาถึงด่านนี้แปลว่า axios กรอง error ออกไปแล้วครับ
const createOrganizationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
} satisfies StrictZodShape<CreateOrganizationResponse>);

// ==========================================
// 📦 3. ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
export const createOrganization = async (
  payloadBody: CreateOrganizationDtoBody,
  token: string,
): Promise<CreateOrganizationResponse> => {
  // 🌟 Step 1: แปลงร่างข้อมูลก่อนส่ง (ถ้าผิดกฎ โยน Error ตั้งแต่ยังไม่ยิง API)
  const validatedPayloadBody =
    createOrganizationPayloadBodySchema.parse(payloadBody);

  const response = await apiClient.post<CreateOrganizationResponse>(
    "/api/organizations",
    validatedPayloadBody,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  // 🌟 Step 3: ตรวจสอบของที่ตอบกลับมา
  const validatedResponse = createOrganizationResponseSchema.parse(
    response.data,
  );

  // ส่งข้อมูลที่สะอาด บริสุทธิ์ และมี Type 100% กลับไปให้ TanStack Query ใช้งานต่อ
  return validatedResponse;
};
