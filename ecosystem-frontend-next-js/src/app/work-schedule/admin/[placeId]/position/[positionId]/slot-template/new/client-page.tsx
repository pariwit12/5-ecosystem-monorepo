// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { workScheduleSlotTypeQueries } from "@/features/work-schedule/slot-type/work-schedule-slot-type.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdSlotTemplateNewErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

import ErrorQuery from "./error";

import Loading from "./loading";

import { cn } from "@/lib/utils";

import { ChildrenHeader } from "@/components/children-header";
import { CreateForm } from "@/features/work-schedule/slot-template/components/create-form";

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
    isFetching,
    error: errorQuery,
    refetch,
    dataUpdatedAt,
  } = useQuery(
    workScheduleSlotTypeQueries.queryGetSlotTypesByPositionId(
      positionId,

      userId,
      getToken,

      AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ),
  );

  const { isRedirecting, targetUrl, errorCode } = useEffectCheckError(
    errorQuery,

    workScheduleAdminPlaceIdPositionPositionIdSlotTemplateNewErrorCodeRedirectList,

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

  const availableSlotTypes = dataQuery.slotTypes;

  return (
    <div
      className={cn(
        //
        "w-full",
        "max-w-7xl",

        "mx-auto",

        "flex",
        "flex-col",
        "gap-2 sm:gap-3",

        "relative",

        "px-4 sm:px-6",
        "py-4 sm:py-6",
        //
      )}
    >
      <ChildrenHeader
        title={`สร้าง slotTemplate ใหม่`}
        description={`กรอกรายละเอียดและบันทึกเพื่อดำเนินการต่อ`}
        backHref={`/work-schedule/admin/${placeId}/position/${positionId}/slot-template`}
        //

        // กรณี: ใช้ status bar
        isFetching={isFetching}
        errorQuery={errorQuery}
        refetch={refetch}
        dataUpdatedAt={dataUpdatedAt}
        // (จบ) กรณี: ใช้ status bar
      />

      <CreateForm
        positionId={positionId}
        availableSlotTypes={availableSlotTypes}
        urlOnSuccess={`/work-schedule/admin/${placeId}/position/${positionId}/slot-template`}
        urlOnCancel={`/work-schedule/admin/${placeId}/position/${positionId}/slot-template`}
        skipErrorCodes={[]}
        className=""
      />
    </div>
  );
}
