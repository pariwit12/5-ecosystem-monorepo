// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { workSchedulePlaceQueries } from "@/features/work-schedule/place/work-schedule-place.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdMinMaxNewErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

import ErrorQuery from "./error";

import Loading from "./loading";

import { cn } from "@/lib/utils";

import { ChildrenHeader } from "@/components/children-header";
import { CreateForm } from "@/features/work-schedule/min-max/components/create-form";

export default function Client({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  const { getToken, userId, isLoaded } = useAuth();

  const {
    data: dataQuery,
    isLoading,

    error: errorQuery,
    refetch,
  } = useQuery(
    workSchedulePlaceQueries.queryGetWorkSchedulePlaceById(
      placeId,

      userId,
      getToken,

      AccessControlErrorCode.verifyWorkScheduleAdminAccess,
    ),
  );

  const { isRedirecting, targetUrl, errorCode } = useEffectCheckError(
    errorQuery,
    workScheduleAdminPlaceIdPositionPositionIdMinMaxNewErrorCodeRedirectList,
    dataQuery,
  );

  if (isRedirecting && targetUrl && errorCode) {
    return <RedirectUI targetUrl={targetUrl} errorCode={errorCode} />;
  }

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  if (!isLoaded || isLoading || dataQuery === undefined) {
    return <Loading />;
  }

  const place = dataQuery;

  return (
    <div
      className={cn(
        "@container",

        "w-full",

        "max-w-7xl",

        "mx-auto",

        "flex",
        "flex-col",
        "gap-2 sm:gap-3",

        "relative",

        "px-4 sm:px-6",

        "py-4 sm:py-6",
      )}
    >
      <ChildrenHeader
        title={`สร้างรายการจำนวนพนักงานต่ำสุด-สูงสุดใหม่`}
        description={`กรอกรายละเอียดและบันทึกเพื่อดำเนินการต่อ`}
        backHref={`/work-schedule/admin/${placeId}/position/${positionId}/min-max`}
      />

      <CreateForm
        positionId={positionId}
        placeTimezone={place.timezone}
        urlOnSuccess={`/work-schedule/admin/${placeId}/position/${positionId}/min-max`}
        urlOnCancel={`/work-schedule/admin/${placeId}/position/${positionId}/min-max`}
        skipErrorCodes={[]}
      />
    </div>
  );
}
