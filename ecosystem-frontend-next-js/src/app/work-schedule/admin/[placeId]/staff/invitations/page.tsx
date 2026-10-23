import Client from "./client-page";

export default async function Page({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const resolvedParams = await params;
  return <Client placeId={resolvedParams.placeId} />;
}
