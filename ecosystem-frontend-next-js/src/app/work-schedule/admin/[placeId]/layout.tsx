import { redirect } from "next/navigation";

import { PageErrorList } from "@/constants/page-error-list.enum";

const uuidV7Regex = // ฟอร์แมตสำหรับ UUIDv7
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ placeId: string }>;
}) {
  const resolvedParams = await params;
  const placeId = resolvedParams.placeId;

  if (!uuidV7Regex.test(placeId)) {
    redirect(`/work-schedule?error=${PageErrorList.INVALID_ID}`);
  }

  return <>{children}</>;
}
