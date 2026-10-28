// Pattern: Server Internal Only + CSR
import Client from "./client-page";

export default async function Page({
  params,
}: {
  params: Promise<{ placeId: string; positionId: string }>;
}) {
  const { placeId, positionId } = await params;
  return <Client placeId={placeId} positionId={positionId} />;
}
