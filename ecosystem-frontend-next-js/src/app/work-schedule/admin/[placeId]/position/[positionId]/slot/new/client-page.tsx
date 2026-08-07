// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { workScheduleSlotTemplateQueries } from "@/features/work-schedule/slot-template/work-schedule-slot-template.queries";
import { workScheduleSlotTypeQueries } from "@/features/work-schedule/slot-type/work-schedule-slot-type.queries";
import { workScheduleStaffPositionQueries } from "@/features/work-schedule/staff-position/work-schedule-staff-position.queries";
import { workSchedulePlaceQueries } from "@/features/work-schedule/place/work-schedule-place.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

import ErrorQuery from "./error";

import Loading from "./loading";

import { cn } from "@/lib/utils";

import { ChildrenHeader } from "@/components/children-header";
import { CreateManyForm } from "@/features/work-schedule/slot/components/create-many-form";

export default function WorkScheduleAdminPositionSlotNewClient({
  placeId,
  positionId,
  prefillId,
}: {
  placeId: string;
  positionId: string;
  prefillId?: string;
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
    workScheduleSlotTemplateQueries.queryGetSlotTemplateById(
      prefillId ?? "",

      userId,
      getToken,

      AccessControlErrorCode.verifyWorkScheduleSlotTemplateIdByWorkScheduleAdmin,
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

  const { isRedirecting, targetUrl, errorCode } = useEffectCheckError(
    errorQuery,
    workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList,
    dataQuery,
  );

  const {
    isRedirecting: isRedirectingSlotType,
    targetUrl: targetUrlSlotType,
    errorCode: errorCodeSlotType,
  } = useEffectCheckError(
    errorQuerySlotType,
    workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList,
    dataQuerySlotType,
  );

  const {
    isRedirecting: isRedirectingStaffPosition,
    targetUrl: targetUrlStaffPosition,
    errorCode: errorCodeStaffPosition,
  } = useEffectCheckError(
    errorQueryStaffPosition,
    workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList,
    dataQueryStaffPosition,
  );

  const {
    isRedirecting: isRedirectingPlace,
    targetUrl: targetUrlPlace,
    errorCode: errorCodePlace,
  } = useEffectCheckError(
    errorQueryPlace,
    workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList,
    dataQueryPlace,
  );

  if (isRedirecting && targetUrl && errorCode) {
    return <RedirectUI targetUrl={targetUrl} errorCode={errorCode} />;
  }

  if (isRedirectingSlotType && targetUrlSlotType && errorCodeSlotType) {
    return (
      <RedirectUI targetUrl={targetUrlSlotType} errorCode={errorCodeSlotType} />
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

  if (isRedirectingPlace && targetUrlPlace && errorCodePlace) {
    return <RedirectUI targetUrl={targetUrlPlace} errorCode={errorCodePlace} />;
  }

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  if (errorQuerySlotType && dataQuerySlotType === undefined) {
    return <ErrorQuery reset={() => refetchSlotType()} />;
  }

  if (errorQueryStaffPosition && dataQueryStaffPosition === undefined) {
    return <ErrorQuery reset={() => refetchStaffPosition()} />;
  }

  if (errorQueryPlace && dataQueryPlace === undefined) {
    return <ErrorQuery reset={() => refetchPlace()} />;
  }

  if (
    !isLoaded ||
    isLoading ||
    isLoadingSlotType ||
    isLoadingStaffPosition ||
    isLoadingPlace ||
    (prefillId !== undefined && dataQuery === undefined) ||
    dataQuerySlotType === undefined ||
    dataQueryStaffPosition === undefined ||
    dataQueryPlace === undefined
  ) {
    return <Loading />;
  }

  const slotTemplate = dataQuery;
  const slotTypes = dataQuerySlotType.slotTypes;
  const staffPositions = dataQueryStaffPosition.staffPositions;
  const place = dataQueryPlace;

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
        title={`สร้างตารางเวร`}
        description={`กรอกรายละเอียดและบันทึกเพื่อดำเนินการต่อ`}
        backHref={`/work-schedule/admin/${placeId}/position/${positionId}/slot/new/menu`}
        //

        // กรณี: ใช้ status bar
        isFetching={isFetching}
        errorQuery={errorQuery}
        refetch={refetch}
        dataUpdatedAt={dataUpdatedAt}
        // (จบ) กรณี: ใช้ status bar
      />

      {staffPositions.length === 0 && (
        <div className="w-full border border-gray-200 rounded-xl shadow-sm bg-white divide-y divide-gray-100">
          <div className="py-6 text-center text-gray-500">
            ไม่พบข้อมูลพนักงานของตำแหน่งงานนี้
            กรุณาเพิ่มพนักงานเข้าตำแหน่งงานนี้ก่อน
          </div>
        </div>
      )}

      {slotTypes.length === 0 && (
        <div className="w-full border border-gray-200 rounded-xl shadow-sm bg-white divide-y divide-gray-100">
          <div className="py-6 text-center text-gray-500">
            ไม่พบข้อมูลชนิด/ประเภทกะการทำงานของตำแหน่งงานนี้
            กรุณาเพิ่มชนิด/ประเภทกะการทำงานเข้าตำแหน่งงานนี้ก่อน
          </div>
        </div>
      )}

      {staffPositions.length > 0 && slotTypes.length > 0 && (
        <CreateManyForm
          positionId={positionId}
          staffPositions={staffPositions}
          placeTimezone={place.timezone}
          availableSlotTypes={slotTypes}
          prefillSlotTypeId={slotTemplate?.slotTypeId}
          prefillStartTime={slotTemplate?.startTime}
          prefillDurationMinute={slotTemplate?.durationMinute}
          urlOnSuccess={`/work-schedule/admin/${placeId}/position/${positionId}/slot`}
          urlOnCancel={`/work-schedule/admin/${placeId}/position/${positionId}/slot/new/menu`}
          skipErrorCodes={[]}
          className=""
        />
      )}
    </div>
  );
}
