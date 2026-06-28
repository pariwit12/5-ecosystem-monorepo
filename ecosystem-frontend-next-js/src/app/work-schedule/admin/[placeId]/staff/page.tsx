import { redirect } from "next/navigation";
import WorkScheduleAdminStaffClient from "./client-page";

// ==========================================
// เตรียมฟังก์ชัน สำหรับตรวจสอบ URL
// ==========================================
// 🌟 สร้าง Regex ตรวจสอบ UUID (วางไว้นอก Component เพื่อไม่ให้ถูกสร้างใหม่ทุกรอบ)
// ฟอร์แมตนี้เฉพาะ UUIDv7 เท่านั้น (ปลอดภัยและรัดกุมขั้นสุด)
const uuidV7Regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ==========================================
// 🖥️ Component หลัก
// ==========================================
export default async function WorkScheduleAdminStaffPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const resolvedParams = await params;
  const placeId = resolvedParams.placeId;

  if (!uuidV7Regex.test(placeId)) {
    redirect("/work-schedule?error=invalid_id"); // เตะกลับทันทีที่ฝั่งเซิร์ฟเวอร์ (ไร้รอยต่อ)
  }

  return <WorkScheduleAdminStaffClient placeId={placeId} />;
}
