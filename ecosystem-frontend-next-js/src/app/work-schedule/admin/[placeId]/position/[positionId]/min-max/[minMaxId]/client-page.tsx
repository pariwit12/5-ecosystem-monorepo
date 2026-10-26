// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { workScheduleMinMaxQueries } from "@/features/work-schedule/min-max/work-schedule-min.queries";
import { workSchedulePlaceQueries } from "@/features/work-schedule/place/work-schedule-place.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import RedirectUI from "@/components/redirect/redirect-ui";
import { cn } from "@/lib/utils";
import { ChildrenHeader } from "@/components/children-header";
import { EditForm } from "@/features/work-schedule/min-max/components/edit-form";
import { workScheduleAdminPlaceIdPositionPositionIdMinMaxMinMaxIdErrorCodeRedirectList } from "./error-code-redirect-list";
import ErrorQuery from "./error";
import Loading from "./loading";

export default function Client({
  placeId,
  positionId,
  minMaxId,
}: {
  placeId: string;
  positionId: string;
  minMaxId: string;
}) {
  const { getToken, userId, isLoaded } = useAuth();

  const {
    data: dataQueryPlace,
    isLoading: isLoadingPlace,
    error: errorQueryPlace,
    refetch: refetchPlace,
  } = useQuery(
    workSchedulePlaceQueries.queryGetWorkSchedulePlaceById(
      placeId,
      userId,
      getToken,
      AccessControlErrorCode.verifyWorkScheduleAdminAccess,
    ),
  );

  const {
    data: dataQueryMinMax,
    isLoading: isLoadingMinMax,
    error: errorQueryMinMax,
    refetch: refetchMinMax,
  } = useQuery(
    workScheduleMinMaxQueries.queryGetMinMaxById(
      positionId,
      minMaxId,
      userId,
      getToken,
      [
        ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND,
        ...AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
      ],
    ),
  );

  const {
    isRedirecting: isRedirectingPlace,
    targetUrl: targetUrlPlace,
    errorCode: errorCodePlace,
  } = useEffectCheckError(
    errorQueryPlace,
    workScheduleAdminPlaceIdPositionPositionIdMinMaxMinMaxIdErrorCodeRedirectList,
    dataQueryPlace,
  );

  const {
    isRedirecting: isRedirectingMinMax,
    targetUrl: targetUrlMinMax,
    errorCode: errorCodeMinMax,
  } = useEffectCheckError(
    errorQueryMinMax,
    workScheduleAdminPlaceIdPositionPositionIdMinMaxMinMaxIdErrorCodeRedirectList,
    dataQueryMinMax,
  );

  if (!isLoaded) return <Loading />;

  if (isRedirectingMinMax && targetUrlMinMax && errorCodeMinMax) {
    return <RedirectUI targetUrl={targetUrlMinMax} errorCode={errorCodeMinMax} />;
  }

  if (isRedirectingPlace && targetUrlPlace && errorCodePlace) {
    return <RedirectUI targetUrl={targetUrlPlace} errorCode={errorCodePlace} />;
  }

  if (isLoadingPlace || isLoadingMinMax) return <Loading />;

  if (
    errorQueryPlace ||
    errorQueryMinMax ||
    !dataQueryPlace ||
    !dataQueryMinMax
  ) {
    return (
      <ErrorQuery
        reset={() => {
          refetchPlace();
          refetchMinMax();
        }}
      />
    );
  }

  const listUrl = `/work-schedule/admin/${placeId}/position/${positionId}/min-max`;

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
        title="แก้ไขรายการ min/max"
        description="แก้ไขข้อมูลหรือลบรายการ min/max ในตำแหน่งงานนี้"
        backHref={listUrl}
      />
      <EditForm
        key={`${positionId}:${dataQueryMinMax.id}`}
        positionId={positionId}
        placeTimezone={dataQueryPlace.timezone}
        minMax={dataQueryMinMax}
        urlOnSuccess={listUrl}
        urlOnCancel={listUrl}
        errorCodeRedirectList={
          workScheduleAdminPlaceIdPositionPositionIdMinMaxMinMaxIdErrorCodeRedirectList
        }
      />
    </div>
  );
}
