// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

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
  type SlotPeriod,
  createSlotPeriodRange,
  formatSlotDateRange,
  parseSlotDateRange,
  shiftSlotPeriodRange,
} from "./slot-date-range";

const periodControls: {
  period: SlotPeriod;
  groupLabel: string;
  label: string;
  previousLabel: string;
  nextLabel: string;
}[] = [
  {
    period: "month",
    groupLabel: "เลือกช่วงเดือน",
    label: "เดือนนี้",
    previousLabel: "เดือนก่อนหน้า",
    nextLabel: "เดือนถัดไป",
  },
  {
    period: "week",
    groupLabel: "เลือกช่วงสัปดาห์",
    label: "สัปดาห์นี้",
    previousLabel: "สัปดาห์ก่อนหน้า",
    nextLabel: "สัปดาห์ถัดไป",
  },
  {
    period: "day",
    groupLabel: "เลือกช่วงวัน",
    label: "1 วัน",
    previousLabel: "วันก่อนหน้า",
    nextLabel: "วันถัดไป",
  },
];

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
  const [navigationPeriod, setNavigationPeriod] = useState<SlotPeriod | null>(null);
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

  function selectPeriod(period: SlotPeriod, direction?: -1 | 1) {
    if (isFetchingSlot) return;

    const result = direction
      ? shiftSlotPeriodRange(
          period,
          direction,
          place?.timezone,
          navigationPeriod === period ? draftStartDateTime : undefined,
        )
      : createSlotPeriodRange(period, place?.timezone);

    if (!result.ok) {
      setValidationError(result.error);
      return;
    }

    setDraftStartDateTime(result.range.draftStartDateTime);
    setDraftEndDateTime(result.range.draftEndDateTime);
    setNavigationPeriod(period);
    setValidationError(null);
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

      <div>
        <Link
          href={`/work-schedule/admin/${placeId}/position/${positionId}/min-max/new`}
          className="inline-flex rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          สร้าง Min / Max
        </Link>
      </div>

      <form noValidate onSubmit={handleSubmit} aria-label="เลือกช่วงเวลาตารางเวร">
        <fieldset
          disabled={isFetchingSlot}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="flex w-full flex-wrap gap-3">
            {periodControls.map((control) => (
              <div
                key={control.period}
                role="group"
                aria-label={control.groupLabel}
                className="flex items-center gap-1 rounded-xl border border-border p-1"
              >
                <button
                  type="button"
                  aria-label={control.previousLabel}
                  onClick={() => selectPeriod(control.period, -1)}
                  className="rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-50"
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectPeriod(control.period)}
                  className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                >
                  {control.label}
                </button>
                <button
                  type="button"
                  aria-label={control.nextLabel}
                  onClick={() => selectPeriod(control.period, 1)}
                  className="rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent disabled:opacity-50"
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            ))}
          </div>
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
            className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            แสดงตารางเวร
          </button>
        </fieldset>
        {validationError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
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
        <p className="text-sm text-muted-foreground">
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
            workScheduleHolidays={dataQuerySlot.workScheduleHolidays}
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
            <p role="status" className="text-sm text-muted-foreground">
              กำลังโหลดตารางเวร...
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
