// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";
import { useEffectRedirectFromErrorQuery } from "@/hooks/use-effect-redirect-from-error-query";

import { cn } from "@/lib/utils";

import Loading from "./loading";
import ErrorQuery from "./error";

import { ChildrenHeader } from "@/components/children-header";

import { workScheduleStaffPositionQueries } from "@/features/work-schedule/staff-position/work-schedule-staff-position.queries";

import { CreateManyCheckBox } from "@/features/work-schedule/staff-position/components/create-many-check-box";

export default function WorkScheduleAdminPositionStaffPositionNewClient({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  // eslint-disable-next-line
  const router = useRouter();
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

  useEffectRedirectFromErrorQuery.ErrorCodeVerifyWorkSchedulePositionByWorkScheduleAdmin(
    {
      errorQuery: errorQuery,
      dataQuery: dataQuery,
      placeId: placeId,
    },
  );

  if (!isLoaded || isLoading) {
    return <Loading />;
  }

  if (
    errorQuery &&
    dataQuery === undefined &&
    isAxiosError(errorQuery) &&
    AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin.includes(
      errorQuery.response?.data?.errorCode,
    )
  ) {
    return <Loading />;
  }

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  if (dataQuery === undefined) {
    return <Loading />;
  }

  const availableStaffs = dataQuery.availableStaffs;

  return (
    <>
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
    </>
  );
}
