// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { useState } from "react";

import { workScheduleMinMaxQueries } from "@/features/work-schedule/min-max/work-schedule-min.queries";
import { workSchedulePlaceQueries } from "@/features/work-schedule/place/work-schedule-place.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdMinMaxErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

import ErrorQuery from "./error";

import Loading from "./loading";

import { cn } from "@/lib/utils";
import { DateTime } from "luxon";

import Link from "next/link";
import { ChildrenHeader } from "@/components/children-header";
import { DateTimeRangePicker } from "@/components/input/datetime-input";

export default function Client({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  const { getToken, userId, isLoaded } = useAuth();

  const [startDateTime, setStartDateTime] = useState<string>("");
  const [endDateTime, setEndDateTime] = useState<string>("");

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

  const place = dataQueryPlace;

  const getISOStringWithLuxon = (dateString: string, tzName?: string) => {
    // ถ้าไม่มีค่าเวลา หรือยังดึง Timezone มาไม่เสร็จ ให้คืนค่าว่าง
    if (!dateString || !tzName) return "";

    // dateString จะหน้าตาประมาณ "2026-08-03T12:00" (ได้จาก datetime-local)
    // สร้าง DateTime object โดยระบุว่าเวลานี้ เป็นเวลาของ Timezone ที่ดึงมาได้
    const dt = DateTime.fromISO(dateString, { zone: tzName });

    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่ (เช่น ผู้ใช้อาจจะพิมพ์วันที่ผิดแปลกๆ)
    if (!dt.isValid) return "";

    // แปลงให้เป็น UTC ISO 8601 String ("2026-08-03T05:00:00.000Z")
    return dt.toUTC().toISO();
  };

  let isoStartDateTime = "";
  let isoEndDateTime = "";

  if (place) {
    isoStartDateTime = getISOStringWithLuxon(startDateTime, place.timezone);
    isoEndDateTime = getISOStringWithLuxon(endDateTime, place.timezone);
  }

  const {
    data: dataQuery,
    isLoading,
    isFetching,
    error: errorQuery,
    refetch,
    dataUpdatedAt,
  } = useQuery(
    workScheduleMinMaxQueries.queryGetMinMaxsByPositionIdStartTimeEndTime(
      positionId,

      isoStartDateTime,
      isoEndDateTime,

      userId,
      getToken,

      AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ),
  );

  const {
    isRedirecting: isRedirectingPlace,
    targetUrl: targetUrlPlace,
    errorCode: errorCodePlace,
  } = useEffectCheckError(
    errorQueryPlace,
    workScheduleAdminPlaceIdPositionPositionIdMinMaxErrorCodeRedirectList,
    dataQueryPlace,
  );

  const { isRedirecting, targetUrl, errorCode } = useEffectCheckError(
    errorQuery,
    workScheduleAdminPlaceIdPositionPositionIdMinMaxErrorCodeRedirectList,
    dataQuery,
  );

  if (isRedirectingPlace && targetUrlPlace && errorCodePlace) {
    return <RedirectUI targetUrl={targetUrlPlace} errorCode={errorCodePlace} />;
  }

  if (isRedirecting && targetUrl && errorCode) {
    return <RedirectUI targetUrl={targetUrl} errorCode={errorCode} />;
  }

  if (errorQueryPlace && dataQueryPlace === undefined) {
    return <ErrorQuery reset={() => refetchPlace()} />;
  }

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  if (
    !isLoaded ||
    isLoading ||
    isLoadingPlace ||
    (isoStartDateTime && isoEndDateTime && dataQuery === undefined) ||
    dataQueryPlace === undefined
  ) {
    return <Loading />;
  }

  let minMaxs = undefined;
  if (dataQuery) minMaxs = dataQuery.minMaxs;

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
        //
        title={`รายการจำนวนพนักงานต่ำสุดและสูงสุด`}
        description={`จัดการและตรวจสอบข้อมูลรายการทั้งหมดในระบบ`}
        backHref={`/work-schedule/admin/${placeId}/position/${positionId}`}
        //

        // กรณี: ใช้ create button
        createHref={`/work-schedule/admin/${placeId}/position/${positionId}/min-max/new`}
        createLabel={`สร้างข้อมูลใหม่`}
        // (จบ) กรณี: ใช้ create button

        // กรณี: ใช้ status bar
        isFetching={isFetching}
        errorQuery={errorQuery}
        refetch={refetch}
        dataUpdatedAt={dataUpdatedAt}
        // (จบ) กรณี: ใช้ status bar
      />

      <DateTimeRangePicker
        startDateTime={startDateTime}
        endDateTime={endDateTime}
        onStartChange={setStartDateTime}
        onEndChange={setEndDateTime}
        isSubmitting={isLoading}
      />

      {isoStartDateTime && isoEndDateTime && minMaxs !== undefined && (
        <div className="w-full overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-800 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">เริ่มต้น</th>
                <th className="px-6 py-4 font-semibold">สิ้นสุด</th>
                <th className="px-6 py-4 font-semibold text-right">ต่ำสุด</th>
                <th className="px-6 py-4 font-semibold text-right">สูงสุด</th>
                <th className="px-6 py-4 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {minMaxs.map((mm) => (
                <tr
                  key={mm.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {mm.startTime}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {mm.endTime}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-500">
                    {mm.min}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-500">
                    {mm.max}
                  </td>

                  {/* คอลัมน์: Action */}
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/work-schedule/admin/${placeId}/position/${positionId}/min-max/${mm.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      เลือก
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {minMaxs.length === 0 && (
            <div className="py-6 text-center text-gray-500">ไม่พบข้อมูล</div>
          )}
        </div>
      )}
    </div>
  );
}
