// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

import { redirect } from "next/navigation";

import WorkScheduleAdminPositionClient from "./client-page";

const uuidV7Regex = // ฟอร์แมตสำหรับ UUIDv7
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function WorkScheduleAdminPositionPage({
  params,
}: {
  params: Promise<{
    placeId: string;
  }>;
}) {
  const resolvedParams = await params;

  const placeId = resolvedParams.placeId;

  if (!uuidV7Regex.test(placeId)) {
    redirect("/work-schedule?error=invalid_id");
  }

  return <WorkScheduleAdminPositionClient placeId={placeId} />;
}
