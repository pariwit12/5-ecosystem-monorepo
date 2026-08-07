// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

import Client from "./client-page";

export default async function Page({
  params,
}: {
  params: Promise<{
    placeId: string;
    positionId: string;
  }>;
}) {
  const resolvedParams = await params;

  const placeId = resolvedParams.placeId;
  const positionId = resolvedParams.positionId;

  return <Client placeId={placeId} positionId={positionId} />;
}
