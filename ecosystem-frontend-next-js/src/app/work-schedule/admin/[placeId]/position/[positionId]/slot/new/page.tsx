// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

import { redirect } from "next/navigation";

import WorkScheduleAdminPositionSlotNewClient from "./client-page";

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

export default async function WorkScheduleAdminPositionSlotNewPage({
  params,
  searchParams,
}: {
  params: Promise<{
    placeId: string;
    positionId: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
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

  // ==========================================
  // ตรวจสอบ URL (query)
  // ==========================================

  const resolvedSearchParams = await searchParams;

  const prefillId =
    typeof resolvedSearchParams.prefillId === "string"
      ? resolvedSearchParams.prefillId
      : undefined;

  if (prefillId !== undefined && !uuidV7Regex.test(prefillId)) {
    redirect(
      `/work-schedule/admin/${placeId}/position/${positionId}/slot/new/pre-fill?error=invalid_id`,
    );
  }

  // ==========================================
  // (จบ) ตรวจสอบ URL (query)
  // ==========================================

  return (
    <WorkScheduleAdminPositionSlotNewClient
      placeId={placeId}
      positionId={positionId}
      prefillId={prefillId}
    />
  );
}
