// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { workScheduleSlotQueries } from "@/features/work-schedule/slot/work-schedule-slot.queries";
import { workScheduleSlotTypeQueries } from "@/features/work-schedule/slot-type/work-schedule-slot-type.queries";
import { workScheduleStaffPositionQueries } from "@/features/work-schedule/staff-position/work-schedule-staff-position.queries";
import { workSchedulePlaceQueries } from "@/features/work-schedule/place/work-schedule-place.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdSlotSlotIdErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

import ErrorQuery from "./error";
import Loading from "./loading";

import { cn } from "@/lib/utils";
import { ChildrenHeader } from "@/components/children-header";
import { EditSlotForm } from "@/features/work-schedule/slot/components/edit-slot-form";

export default function WorkScheduleAdminPositionSlotEditClient({
  placeId,
  positionId,
  slotId,
}: {
  placeId: string;
  positionId: string;
  slotId: string;
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
    data: dataQuerySlot,
    isLoading: isLoadingSlot,
    error: errorQuerySlot,
    refetch: refetchSlot,
  } = useQuery(
    workScheduleSlotQueries.queryGetSlotById(
      positionId,
      slotId,
      userId,
      getToken,
      [
        ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND,
        ...AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
      ],
    ),
  );

  const {
    data: dataQuerySlotType,
    isLoading: isLoadingSlotType,
    error: errorQuerySlotType,
    refetch: refetchSlotType,
  } = useQuery(
    workScheduleSlotTypeQueries.queryGetSlotTypesByPositionId(
      positionId,
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
    workScheduleAdminPlaceIdPositionPositionIdSlotSlotIdErrorCodeRedirectList,
    dataQuerySlot,
  );

  const {
    isRedirecting: isRedirectingPlace,
    targetUrl: targetUrlPlace,
    errorCode: errorCodePlace,
  } = useEffectCheckError(
    errorQueryPlace,
    workScheduleAdminPlaceIdPositionPositionIdSlotSlotIdErrorCodeRedirectList,
    dataQueryPlace,
  );

  const {
    isRedirecting: isRedirectingSlotType,
    targetUrl: targetUrlSlotType,
    errorCode: errorCodeSlotType,
  } = useEffectCheckError(
    errorQuerySlotType,
    workScheduleAdminPlaceIdPositionPositionIdSlotSlotIdErrorCodeRedirectList,
    dataQuerySlotType,
  );

  const {
    isRedirecting: isRedirectingStaffPosition,
    targetUrl: targetUrlStaffPosition,
    errorCode: errorCodeStaffPosition,
  } = useEffectCheckError(
    errorQueryStaffPosition,
    workScheduleAdminPlaceIdPositionPositionIdSlotSlotIdErrorCodeRedirectList,
    dataQueryStaffPosition,
  );

  if (!isLoaded) return <Loading />;

  if (isRedirectingSlot && targetUrlSlot && errorCodeSlot) {
    return <RedirectUI targetUrl={targetUrlSlot} errorCode={errorCodeSlot} />;
  }

  if (isRedirectingPlace && targetUrlPlace && errorCodePlace) {
    return <RedirectUI targetUrl={targetUrlPlace} errorCode={errorCodePlace} />;
  }

  if (isRedirectingSlotType && targetUrlSlotType && errorCodeSlotType) {
    return (
      <RedirectUI
        targetUrl={targetUrlSlotType}
        errorCode={errorCodeSlotType}
      />
    );
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

  if (
    isLoadingPlace ||
    isLoadingSlot ||
    isLoadingSlotType ||
    isLoadingStaffPosition
  ) {
    return <Loading />;
  }

  if (
    errorQueryPlace ||
    errorQuerySlot ||
    errorQuerySlotType ||
    errorQueryStaffPosition ||
    !dataQueryPlace ||
    !dataQuerySlot ||
    !dataQuerySlotType ||
    !dataQueryStaffPosition
  ) {
    return (
      <ErrorQuery
        reset={() => {
          refetchPlace();
          refetchSlot();
          refetchSlotType();
          refetchStaffPosition();
        }}
      />
    );
  }

  const slot = dataQuerySlot;
  const availableSlotTypes = dataQuerySlotType.slotTypes;
  const availableStaffPositions = dataQueryStaffPosition.staffPositions.map(
    (sp) => ({
      staffId: sp.staffId,
      name: sp.name,
    }),
  );

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
        title="แก้ไขรายการเวร"
        description="แก้ไขข้อมูลหรือลบรายการเวรในตำแหน่งงานนี้"
        backHref={`/work-schedule/admin/${placeId}/position/${positionId}/slot`}
      />

      <EditSlotForm
        key={`${positionId}:${slot.id}`}
        positionId={positionId}
        placeTimezone={dataQueryPlace.timezone}
        slot={slot}
        availableStaffPositions={availableStaffPositions}
        availableSlotTypes={availableSlotTypes}
        urlOnSuccess={`/work-schedule/admin/${placeId}/position/${positionId}/slot`}
        urlOnCancel={`/work-schedule/admin/${placeId}/position/${positionId}/slot`}
        errorCodeRedirectList={
          workScheduleAdminPlaceIdPositionPositionIdSlotSlotIdErrorCodeRedirectList
        }
      />
    </div>
  );
}
