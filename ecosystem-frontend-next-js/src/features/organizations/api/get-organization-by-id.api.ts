import { z } from "zod";
import apiClient from "@/lib/axios";

import { type GetOrganizationByIdResponse } from "@backend/modules/organizations/queries/get-organization-by-id.query";

// 🌟 1. สร้าง Type Helper (แนะนำให้ก๊อปอันนี้ไปสร้างไฟล์ src/types/zod.type.ts ไว้ใช้ยาวๆ เลยครับ)
export type StrictZodShape<T> = {
  [K in keyof T]: z.ZodType<T[K]>;
};

// 🌟 สร้าง Regex สำหรับดัก UUIDv7 โดยเฉพาะ
const uuidV7Regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ==========================================
// 🚀 1. ด่านขาออก Payload/Request (+/- Transformation)
// ==========================================

// ==========================================
// 🛡️ 2. ด่านขาเข้า (Response Validation)
// ==========================================

// 🌟 ท่าไม้ตายที่ 1: ดึง Type ของ Enum ออกมาจาก Backend ตรงๆ
// (ใช้ NonNullable เพื่อเจาะทะลุค่า null เข้าไปเอา type ข้างในครับ)
type PaymentStatus = NonNullable<
  GetOrganizationByIdResponse["organizationDentalClinic"]
>["paymentStatus"];

// 🌟 ท่าไม้ตายที่ 2: สร้าง Record เป็น "กับดักเช็คลิสต์"
// ถ้า Backend มีเพิ่ม หรือเราพิมพ์ขาด/เกิน/พิมพ์ผิด ตัวแปรนี้จะ "เด้งขีดแดงเตือนทันที!"
const paymentStatusMap: Record<PaymentStatus, true> = {
  DONE: true,
  CREDIT_CARD_EXPIRED: true,
  CREDIT_CARD_INVALID: true,
  // 💡 ลองคอมเมนต์ทิ้ง 1 บรรทัด หรือพิมพ์ค่าแปลกๆ ดูครับ TypeScript จะขีดแดงด่าทันที
};

// 🌟 ท่าไม้ตายที่ 3: ดึง Key ที่ถูกต้องเป๊ะๆ 100% ออกมาเป็น Array เพื่อส่งต่อให้ Zod
const paymentStatusValues = Object.keys(paymentStatusMap) as [
  PaymentStatus,
  ...PaymentStatus[],
];

// ถ้าผ่านมาถึงด่านนี้แปลว่า axios กรอง error ออกไปแล้วครับ
const getOrganizationByIdResponseSchema = z.object({
  id: z
    .string()
    .regex(
      uuidV7Regex,
      "ต้องเป็นรูปแบบ UUIDv7 เท่านั้น (zod check data from backend)",
    ),
  name: z.string(),

  organizationDentalClinic: z.object({
    id: z
      .string()
      .regex(
        uuidV7Regex,
        "ต้องเป็นรูปแบบ UUIDv7 เท่านั้น (zod check data from backend)",
      ),

    paymentStatus: z.enum(paymentStatusValues),

    // 🛡️ สำหรับฟิลด์ Date เรามีทางเลือก 2 แบบครับ (เลือกใช้ตามความเข้มงวด)

    // แบบที่ 1: มาตรฐาน (แปลง String จาก JSON เป็น Date ให้อัตโนมัติ)
    // subscriptionEndDate: z.coerce.date().nullable(),

    // แบบที่ 2: เป๊ะขั้นสุด (บังคับรับแค่ YYYY-MM-DD แบบไม่มีเวลาติดมาด้วย ค่อยแปลงร่าง)
    subscriptionEndDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "ต้องเป็นรูปแบบ YYYY-MM-DD เท่านั้น  (zod check data from backend)",
      )
      .transform((str) => new Date(str))
      .nullable(),
  }),
} satisfies StrictZodShape<GetOrganizationByIdResponse>);

// ==========================================
// 📦 3. ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================

export const getOrganizationById = async (
  orgId: string,
  token: string,
): Promise<GetOrganizationByIdResponse> => {
  const response = await apiClient.get<GetOrganizationByIdResponse>(
    `/api/organizations/${orgId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  // 🌟 Step 3: ตรวจสอบของที่ตอบกลับมา
  const validatedResponse = getOrganizationByIdResponseSchema.parse(
    response.data,
  );

  return validatedResponse;
};
