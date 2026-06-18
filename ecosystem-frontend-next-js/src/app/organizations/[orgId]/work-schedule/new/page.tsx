import { redirect } from "next/navigation";
import NewWorkScheduleClient from "./client-page";

const uuidV7Regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const resolvedParams = await params;
  const orgId = resolvedParams.orgId;

  if (!uuidV7Regex.test(orgId)) {
    redirect("/organizations?error=invalid_id");
  }

  return <NewWorkScheduleClient orgId={orgId} />;
}
