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
    slotId: string;
  }>;
}) {
  const resolvedParams = await params;

  const placeId = resolvedParams.placeId;
  const positionId = resolvedParams.positionId;
  const slotId = resolvedParams.slotId;

  return <Client placeId={placeId} positionId={positionId} slotId={slotId} />;
}
