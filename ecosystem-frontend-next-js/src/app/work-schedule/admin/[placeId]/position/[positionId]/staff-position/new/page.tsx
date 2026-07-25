// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

import { redirect } from "next/navigation";

import WorkScheduleAdminPositionStaffPositionNewClient from "./client-page";

// ==========================================
// สร้างฟังก์ชัน สำหรับตรวจสอบ URL
// ==========================================

const uuidV7Regex = // ฟอร์แมตสำหรับ UUIDv7
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ==========================================
// (จบ) สร้างฟังก์ชัน สำหรับตรวจสอบ URL
// ==========================================

// ==========================================
// 🖥️ Component หลัก
// ==========================================

export default async function WorkScheduleAdminPositionStaffPositionNewPage({
  params,
}: {
  params: Promise<{
    placeId: string;
    positionId: string;
  }>;
}) {
  //
  // ==========================================
  // ตรวจสอบ URL (param)
  // ==========================================

  const resolvedParams = await params;

  const placeId = resolvedParams.placeId;

  if (!uuidV7Regex.test(placeId)) {
    redirect("/work-schedule?error=invalid_id");
  }

  const positionId = resolvedParams.positionId;

  if (!uuidV7Regex.test(positionId)) {
    redirect(`/work-schedule/admin/${placeId}/position?error=invalid_id`);
  }

  // ==========================================
  // (จบ) ตรวจสอบ URL (param)
  // ==========================================

  return (
    <WorkScheduleAdminPositionStaffPositionNewClient
      placeId={placeId}
      positionId={positionId}
    />
  );
}
