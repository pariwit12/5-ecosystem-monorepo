// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { workScheduleStaffPositionQueries } from "@/features/work-schedule/staff-position/work-schedule-staff-position.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdStaffPositionNewErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

import ErrorQuery from "./error";

import Loading from "./loading";

import { cn } from "@/lib/utils";

import { ChildrenHeader } from "@/components/children-header";
import { CreateManyCheckBox } from "@/features/work-schedule/staff-position/components/create-many-check-box";

export default function WorkScheduleAdminPositionStaffPositionNewClient({
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
    workScheduleStaffPositionQueries.queryGetAvailableStaffsByPositionId(
      positionId,

      userId,
      getToken,

      AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ),
  );

  const { isRedirecting, targetUrl, errorCode } = useEffectCheckError(
    errorQuery,
    workScheduleAdminPlaceIdPositionPositionIdStaffPositionNewErrorCodeRedirectList,
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

  const availableStaffs = dataQuery.availableStaffs;

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
        title={`เพิ่มพนักงานเข้าตำแหน่งงานนี้`}
        description={`เลือกรายการที่ต้องการเพิ่ม`}
        backHref={`/work-schedule/admin/${placeId}/position/${positionId}/staff-position`}
        isFetching={isFetching}
        errorQuery={errorQuery}
        refetch={refetch}
        dataUpdatedAt={dataUpdatedAt}
      />

      <CreateManyCheckBox
        positionId={positionId}
        staffs={availableStaffs}
        urlOnSuccess={``}
        urlOnCancel={``}
        skipErrorCodes={[]}
      />
    </div>
  );
}
