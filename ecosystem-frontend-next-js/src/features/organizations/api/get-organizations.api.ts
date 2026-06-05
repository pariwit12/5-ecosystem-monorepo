import { z } from "zod";
import apiClient from "@/lib/axios";

import { type GetOrganizationsResponse } from "@backend/modules/organizations/queries/get-organizations.query";

// 🌟 1. สร้าง Type Helper (แนะนำให้ก๊อปอันนี้ไปสร้างไฟล์ src/types/zod.type.ts ไว้ใช้ยาวๆ เลยครับ)
export type StrictZodShape<T> = {
  [K in keyof T]: z.ZodType<T[K]>;
};

// ==========================================
// 🚀 1. ด่านขาออก Payload/Request (+/- Transformation)
// ==========================================

// ==========================================
// 🛡️ 2. ด่านขาเข้า (Response Validation)
// ==========================================
// ถ้าผ่านมาถึงด่านนี้แปลว่า axios กรอง error ออกไปแล้วครับ
const getOrganizationsResponseSchema = z.object({
  success: z.boolean(),
  // ใช้ z.array() ครอบ z.object() อีกชั้น เพื่อบอกว่าเป็นลิสต์ของออบเจกต์
  organizations: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
} satisfies StrictZodShape<GetOrganizationsResponse>);

// ==========================================
// 📦 3. ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================

export const getOrganizations = async (
  token: string,
): Promise<GetOrganizationsResponse> => {
  const response = await apiClient.get<GetOrganizationsResponse>(
    "/api/organizations",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  // 🌟 Step 3: ตรวจสอบของที่ตอบกลับมา
  const validatedResponse = getOrganizationsResponseSchema.parse(response.data);

  return validatedResponse;
};
