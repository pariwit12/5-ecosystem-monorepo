// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

import { redirect } from "next/navigation";
import { PageErrorList } from "@/constants/page-error-list.enum";

import Client from "./client-page";

const uuidV7Regex = // ฟอร์แมตสำหรับ UUIDv7
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function Page({
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
  const resolvedParams = await params;

  const placeId = resolvedParams.placeId;
  const positionId = resolvedParams.positionId;

  const resolvedSearchParams = await searchParams;

  const prefillId =
    typeof resolvedSearchParams.prefillId === "string"
      ? resolvedSearchParams.prefillId
      : undefined;

  if (prefillId !== undefined && !uuidV7Regex.test(prefillId)) {
    redirect(
      `/work-schedule/admin/${placeId}/position/${positionId}/slot/new/pre-fill?error=${PageErrorList.INVALID_ID}`,
    );
  }

  return (
    <Client placeId={placeId} positionId={positionId} prefillId={prefillId} />
  );
}
