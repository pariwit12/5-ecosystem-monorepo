import { z } from "zod";
import apiClient from "@/lib/axios";

// ==========================================
// 🚀 1. ด่านขาออก (Request/Payload Transformation)
// ==========================================
// สมมติว่าหน้าจอ UI ส่งมาแค่ { name: "Toothcraft Clinic" }
// แต่ NestJS หลังบ้านบังคับว่าต้องส่งฟิลด์ type ไปด้วย
const createOrganizationPayloadSchema = z.object({
  name: z.string(),
});
// .transform((data) => ({
//   ...data,
//   type: "DENTAL_CLINIC", // 🌟 แปลงร่าง/เติมข้อมูลให้สอดคล้องกับระบบ Toothcraft โดยที่หน้า UI ไม่ต้องเหนื่อย
//   clientTimestamp: new Date().toISOString(),
// }));

// ==========================================
// 🛡️ 2. ด่านขาเข้า (Response Validation)
// ==========================================
// เช็คว่าสร้างเสร็จแล้ว NestJS คืน id กลับมาให้เราจริงๆ ไหม
// ถ้าผ่านมาถึงด่านนี้แปลว่า axios กรอง error ออกไปแล้วครับ
const createOrganizationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  // organization: z.object({
  //   id: z.string(),
  //   name: z.string(),
  // }),
});

// ==========================================
// 📦 3. ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
// รับ rawInput มาแบบดิบๆ (เช่น จาก Form)
export const createOrganization = async (
  rawInput: { name: string },
  token: string,
) => {
  // 🌟 Step 1: แปลงร่างข้อมูลก่อนส่ง (ถ้าผิดกฎ โยน Error ตั้งแต่ยังไม่ยิง API)
  const payload = createOrganizationPayloadSchema.parse(rawInput);

  const response = await apiClient.post("/api/organizations", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // 🌟 Step 3: ตรวจสอบของที่ตอบกลับมา
  const validatedResponse = createOrganizationResponseSchema.parse(
    response.data,
  );

  // ส่งข้อมูลที่สะอาด บริสุทธิ์ และมี Type 100% กลับไปให้ TanStack Query ใช้งานต่อ
  return validatedResponse;
};
