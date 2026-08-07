// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { workScheduleSlotTypeQueries } from "@/features/work-schedule/slot-type/work-schedule-slot-type.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdSlotTypeErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

import ErrorQuery from "./error";

import Loading from "./loading";

import { cn } from "@/lib/utils";

import { ChildrenHeader } from "@/components/children-header";
import Link from "next/link";

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

    workScheduleAdminPlaceIdPositionPositionIdSlotTypeErrorCodeRedirectList,

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

  const slotTypes = dataQuery.slotTypes;

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
          title={`รายการ SlotType`}
          description={`จัดการและตรวจสอบข้อมูลรายการทั้งหมดในระบบ`}
          backHref={`/work-schedule/admin/${placeId}/position/${positionId}`}
          //

          // กรณี: ใช้ create button
          createHref={`/work-schedule/admin/${placeId}/position/${positionId}/slot-type/new`}
          createLabel={`สร้างข้อมูลใหม่`}
          // (จบ) กรณี: ใช้ create button

          // กรณี: ใช้ status bar
          isFetching={isFetching}
          errorQuery={errorQuery}
          refetch={refetch}
          dataUpdatedAt={dataUpdatedAt}
          // (จบ) กรณี: ใช้ status bar
        />

        <div className="w-full border border-gray-200 rounded-xl shadow-sm bg-white divide-y divide-gray-100">
          {slotTypes.map((slotType) => (
            <div
              key={slotType.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4 hover:bg-gray-50/50 transition-colors"
            >
              <h3 className="text-base font-semibold text-gray-800">
                {slotType.name}
              </h3>

              <Link
                href={`/work-schedule/admin/${placeId}/position/${positionId}/slot-type/${slotType.id}`}
                className="w-full sm:w-auto px-6 py-2 text-center font-medium rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                เลือก
              </Link>
            </div>
          ))}

          {slotTypes.length === 0 && (
            <div className="py-6 text-sm text-center text-gray-500">
              ไม่พบข้อมูล
            </div>
          )}
        </div>
      </div>
    </>
  );
}
