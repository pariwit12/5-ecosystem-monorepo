import Client from "./client-page";

export default async function Page({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const resolvedParams = await params;
  const placeId = resolvedParams.placeId;

  return <Client placeId={placeId} />;
}
