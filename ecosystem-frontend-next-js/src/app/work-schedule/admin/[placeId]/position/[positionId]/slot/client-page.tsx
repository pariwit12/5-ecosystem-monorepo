// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { useState } from "react";

import { workScheduleSlotQueries } from "@/features/work-schedule/slot/work-schedule-slot.queries";
import { workScheduleStaffPositionQueries } from "@/features/work-schedule/staff-position/work-schedule-staff-position.queries";
import { workSchedulePlaceQueries } from "@/features/work-schedule/place/work-schedule-place.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdSlotErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

import ErrorQuery from "./error";

import Loading from "./loading";

import { cn } from "@/lib/utils";
import { DateTime } from "luxon";

import { ChildrenHeader } from "@/components/children-header";
import { DateTimeRangePicker } from "@/components/input/datetime-input";
import { WorkScheduleBoard } from "./component-work-schedule-board";

export default function WorkScheduleAdminPositionSlotClient({
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
    data: dataQuerySlot,
    isLoading: isLoadingSlot,
    isFetching: isFetchingSlot,
    error: errorQuerySlot,
    refetch: refetchSlot,
    dataUpdatedAt: dataUpdatedAtSlot,
  } = useQuery(
    workScheduleSlotQueries.queryGetSlotsByPositionIdStartTimeEndTime(
      positionId,

      isoStartDateTime,
      isoEndDateTime,

      userId,
      getToken,

      AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ),
  );

  const {
    data: dataQueryStaffPosition,
    isLoading: isLoadingStaffPosition,
    error: errorQueryStaffPosition,
    refetch: refetchStaffPosition,
  } = useQuery(
    workScheduleStaffPositionQueries.queryGetStaffPositionsByPositionId(
      positionId,

      userId,
      getToken,

      AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ),
  );

  const {
    isRedirecting: isRedirectingSlot,
    targetUrl: targetUrlSlot,
    errorCode: errorCodeSlot,
  } = useEffectCheckError(
    errorQuerySlot,
    workScheduleAdminPlaceIdPositionPositionIdSlotErrorCodeRedirectList,
    dataQuerySlot,
  );

  const {
    isRedirecting: isRedirectingStaffPosition,
    targetUrl: targetUrlStaffPosition,
    errorCode: errorCodeStaffPosition,
  } = useEffectCheckError(
    errorQueryStaffPosition,
    workScheduleAdminPlaceIdPositionPositionIdSlotErrorCodeRedirectList,
    dataQueryStaffPosition,
  );

  const {
    isRedirecting: isRedirectingPlace,
    targetUrl: targetUrlPlace,
    errorCode: errorCodePlace,
  } = useEffectCheckError(
    errorQueryPlace,
    workScheduleAdminPlaceIdPositionPositionIdSlotErrorCodeRedirectList,
    dataQueryPlace,
  );

  if (isRedirectingSlot && targetUrlSlot && errorCodeSlot) {
    return <RedirectUI targetUrl={targetUrlSlot} errorCode={errorCodeSlot} />;
  }

  if (
    isRedirectingStaffPosition &&
    targetUrlStaffPosition &&
    errorCodeStaffPosition
  ) {
    return (
      <RedirectUI
        targetUrl={targetUrlStaffPosition}
        errorCode={errorCodeStaffPosition}
      />
    );
  }

  if (isRedirectingPlace && targetUrlPlace && errorCodePlace) {
    return <RedirectUI targetUrl={targetUrlPlace} errorCode={errorCodePlace} />;
  }

  if (errorQuerySlot && dataQuerySlot === undefined) {
    return <ErrorQuery reset={() => refetchSlot()} />;
  }

  if (errorQueryStaffPosition && dataQueryStaffPosition === undefined) {
    return <ErrorQuery reset={() => refetchStaffPosition()} />;
  }

  if (errorQueryPlace && dataQueryPlace === undefined) {
    return <ErrorQuery reset={() => refetchPlace()} />;
  }

  if (
    !isLoaded ||
    isLoadingSlot ||
    isLoadingStaffPosition ||
    isLoadingPlace ||
    (startDateTime && endDateTime && dataQuerySlot === undefined) ||
    dataQueryStaffPosition === undefined ||
    dataQueryPlace === undefined ||
    place === undefined
  ) {
    return <Loading />;
  }

  let workScheduleSlots = undefined;
  let minMaxs = undefined;
  if (dataQuerySlot) {
    workScheduleSlots = dataQuerySlot.workScheduleSlots;
    minMaxs = dataQuerySlot.minMaxs;
  }

  const staffPositions = dataQueryStaffPosition.staffPositions;

  return (
    <div
      className={cn(
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
        title={`รายการ workScheduleSlot`}
        description={`จัดการและตรวจสอบข้อมูลรายการทั้งหมดในระบบ`}
        backHref={`/work-schedule/admin/${placeId}/position/${positionId}`}
        //

        // กรณี: ใช้ create button
        createHref={`/work-schedule/admin/${placeId}/position/${positionId}/slot/new/menu`}
        createLabel={`สร้าง workScheduleSlot ใหม่`}
        // (จบ) กรณี: ใช้ create button

        // กรณี: ใช้ status bar
        isFetching={isFetchingSlot}
        errorQuery={errorQuerySlot}
        refetch={refetchSlot}
        dataUpdatedAt={dataUpdatedAtSlot}
        // (จบ) กรณี: ใช้ status bar
      />

      <DateTimeRangePicker
        startDateTime={startDateTime}
        endDateTime={endDateTime}
        onStartChange={setStartDateTime}
        onEndChange={setEndDateTime}
        isSubmitting={isLoadingSlot}
      />

      {isoStartDateTime &&
        isoEndDateTime &&
        workScheduleSlots !== undefined &&
        minMaxs !== undefined && (
          <WorkScheduleBoard
            slots={workScheduleSlots}
            minMaxs={minMaxs}
            staffPositions={staffPositions}
            startDateTime={isoStartDateTime}
            endDateTime={isoEndDateTime}
            placeId={placeId}
            positionId={positionId}
            timezone={place.timezone}
          />
        )}
    </div>
  );
}
