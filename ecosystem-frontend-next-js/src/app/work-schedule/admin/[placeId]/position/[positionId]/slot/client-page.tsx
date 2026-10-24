// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { useState, type FormEvent } from "react";

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

import { ChildrenHeader } from "@/components/children-header";
import { DateTimeRangePicker } from "@/components/input/datetime-input";
import { WorkScheduleBoard } from "./component-work-schedule-board";
import {
  type AppliedSlotRange,
  formatSlotDateRange,
  parseSlotDateRange,
} from "./slot-date-range";

export default function WorkScheduleAdminPositionSlotClient({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  const { getToken, userId, isLoaded } = useAuth();

  const [draftStartDateTime, setDraftStartDateTime] = useState("");
  const [draftEndDateTime, setDraftEndDateTime] = useState("");
  const [appliedRange, setAppliedRange] = useState<AppliedSlotRange | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const {
    data: dataQuerySlot,
    isFetching: isFetchingSlot,
    error: errorQuerySlot,
    refetch: refetchSlot,
    dataUpdatedAt: dataUpdatedAtSlot,
  } = useQuery(
    workScheduleSlotQueries.queryGetSlotsByPositionIdStartTimeEndTime(
      positionId,

      appliedRange?.startTime ?? "",
      appliedRange?.endTime ?? "",

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isFetchingSlot) return;

    const result = parseSlotDateRange(
      draftStartDateTime,
      draftEndDateTime,
      place?.timezone,
    );

    if (!result.ok) {
      setValidationError(result.error);
      return;
    }

    setValidationError(null);
    // The query key changes only with UTC bounds; confirming the same range
    // updates its draft snapshot without forcing a refetch.
    setAppliedRange(result.range);
  }

  function refreshSlots() {
    if (appliedRange && !isFetchingSlot) {
      void refetchSlot();
    }
  }

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

  if (errorQueryStaffPosition && dataQueryStaffPosition === undefined) {
    return <ErrorQuery reset={() => refetchStaffPosition()} />;
  }

  if (errorQueryPlace && dataQueryPlace === undefined) {
    return <ErrorQuery reset={() => refetchPlace()} />;
  }

  if (
    !isLoaded ||
    isLoadingStaffPosition ||
    isLoadingPlace ||
    dataQueryStaffPosition === undefined ||
    dataQueryPlace === undefined ||
    place === undefined
  ) {
    return <Loading />;
  }

  const staffPositions = dataQueryStaffPosition.staffPositions;
  const hasDraftChanges =
    appliedRange !== null &&
    (draftStartDateTime !== appliedRange.draftStartDateTime ||
      draftEndDateTime !== appliedRange.draftEndDateTime ||
      place.timezone !== appliedRange.timezone);
  const rangeLabel = appliedRange ? formatSlotDateRange(appliedRange) : "";

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
        isFetching={appliedRange ? isFetchingSlot : undefined}
        errorQuery={appliedRange ? errorQuerySlot : undefined}
        refetch={appliedRange ? refreshSlots : undefined}
        dataUpdatedAt={appliedRange ? dataUpdatedAtSlot : undefined}
        // (จบ) กรณี: ใช้ status bar
      />

      <form noValidate onSubmit={handleSubmit} aria-label="เลือกช่วงเวลาตารางเวร">
        <fieldset
          disabled={isFetchingSlot}
          className="flex flex-wrap items-end gap-4"
        >
          <DateTimeRangePicker
            startDateTime={draftStartDateTime}
            endDateTime={draftEndDateTime}
            onStartChange={(value) => {
              setDraftStartDateTime(value);
              setValidationError(null);
            }}
            onEndChange={(value) => {
              setDraftEndDateTime(value);
              setValidationError(null);
            }}
            isSubmitting={isFetchingSlot}
          />
          <button
            type="submit"
            className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            แสดงตารางเวร
          </button>
        </fieldset>
        {validationError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {validationError}
          </p>
        )}
      </form>

      {hasDraftChanges && (
        <p className="text-sm text-amber-700">
          มีการเปลี่ยนช่วงเวลา กรุณากดแสดงตารางเวรเพื่ออัปเดตผลลัพธ์
        </p>
      )}

      {appliedRange === null ? (
        <p className="text-sm text-gray-600">
          เลือกช่วงเวลาแล้วกดแสดงตารางเวร
        </p>
      ) : dataQuerySlot !== undefined ? (
        <>
          <p className="text-sm font-medium">
            ช่วงเวลาที่แสดงผล: {rangeLabel}
          </p>
          <WorkScheduleBoard
            slots={dataQuerySlot.workScheduleSlots}
            minMaxs={dataQuerySlot.minMaxs}
            staffPositions={staffPositions}
            startDateTime={appliedRange.startTime}
            endDateTime={appliedRange.endTime}
            placeId={placeId}
            positionId={positionId}
            timezone={appliedRange.timezone}
          />
        </>
      ) : (
        <>
          <p className="text-sm font-medium">
            ช่วงเวลาที่ร้องขอ: {rangeLabel}
          </p>
          {errorQuerySlot ? (
            <ErrorQuery reset={refreshSlots} />
          ) : isFetchingSlot ? (
            <p role="status" className="text-sm text-gray-600">
              กำลังโหลดตารางเวร...
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
