"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { workScheduleSlotTemplateQueries } from "@/features/work-schedule/slot-template/work-schedule-slot-template.queries";
import { workScheduleStaffPositionQueries } from "@/features/work-schedule/staff-position/work-schedule-staff-position.queries";
import { workSchedulePlaceQueries } from "@/features/work-schedule/place/work-schedule-place.queries";
import { workSchedulePositionQueries } from "@/features/work-schedule/position/work-schedule-position.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";
import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList } from "../error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";
import ErrorQuery from "../error";
import Loading from "../loading";
import { ChildrenHeader } from "@/components/children-header";
import { AutoCreateForm } from "@/features/work-schedule/slot/components/auto-create-form";

export default function WorkScheduleAdminPositionSlotAutoClient({
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  const { getToken, userId, isLoaded } = useAuth();
  const position = useQuery(
    workSchedulePositionQueries.queryGetWorkSchedulePositionById(
      positionId,
      userId,
      getToken,
      [...AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin],
    ),
  );
  const templates = useQuery(
    workScheduleSlotTemplateQueries.queryGetSlotTemplatesByPositionId(
      positionId,
      userId,
      getToken,
      AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ),
  );
  const staffs = useQuery(
    workScheduleStaffPositionQueries.queryGetStaffPositionsByPositionId(
      positionId,
      userId,
      getToken,
      AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ),
  );
  const place = useQuery(
    workSchedulePlaceQueries.queryGetWorkSchedulePlaceById(
      position.data?.placeId ?? "",
      userId,
      getToken,
      AccessControlErrorCode.verifyWorkScheduleAdminAccess,
    ),
  );

  const templatesRedirect = useEffectCheckError(
    templates.error,
    workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList,
    templates.data,
  );
  const positionRedirect = useEffectCheckError(
    position.error,
    workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList,
    position.data,
  );
  const staffsRedirect = useEffectCheckError(
    staffs.error,
    workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList,
    staffs.data,
  );
  const placeRedirect = useEffectCheckError(
    place.error,
    workScheduleAdminPlaceIdPositionPositionIdSlotNewErrorCodeRedirectList,
    place.data,
  );

  for (const redirect of [
    positionRedirect,
    templatesRedirect,
    staffsRedirect,
    placeRedirect,
  ]) {
    if (redirect.isRedirecting && redirect.targetUrl && redirect.errorCode) {
      return (
        <RedirectUI
          targetUrl={redirect.targetUrl}
          errorCode={redirect.errorCode}
        />
      );
    }
  }
  if (position.error && position.data === undefined) {
    return <ErrorQuery reset={() => position.refetch()} />;
  }
  if (templates.error && templates.data === undefined) {
    return <ErrorQuery reset={() => templates.refetch()} />;
  }
  if (staffs.error && staffs.data === undefined) {
    return <ErrorQuery reset={() => staffs.refetch()} />;
  }
  if (place.error && place.data === undefined) {
    return <ErrorQuery reset={() => place.refetch()} />;
  }
  if (
    !isLoaded ||
    position.isLoading ||
    templates.isLoading ||
    staffs.isLoading ||
    place.isLoading ||
    position.data === undefined ||
    templates.data === undefined ||
    staffs.data === undefined ||
    place.data === undefined
  ) {
    return <Loading />;
  }

  const slotTemplates = templates.data.slotTemplates;
  const staffPositions = staffs.data.staffPositions;
  const placeId = position.data.placeId;
  const menuUrl = `/work-schedule/admin/${placeId}/position/${positionId}/slot/new/menu`;
  return (
    <div className="@container w-full max-w-7xl mx-auto flex flex-col gap-2 sm:gap-3 relative px-4 sm:px-6 py-4 sm:py-6">
      <ChildrenHeader
        title="จัดเวรอัตโนมัติ"
        description="เลือกช่วงเวลา แบบร่าง และพนักงานเพื่อเติมจำนวนเวรขั้นต่ำ"
        backHref={menuUrl}
        isFetching={
          position.isFetching ||
          templates.isFetching ||
          staffs.isFetching ||
          place.isFetching
        }
        errorQuery={
          position.error || templates.error || staffs.error || place.error
        }
        refetch={() => {
          position.refetch();
          templates.refetch();
          staffs.refetch();
          place.refetch();
        }}
        dataUpdatedAt={Math.min(
          position.dataUpdatedAt,
          templates.dataUpdatedAt,
          staffs.dataUpdatedAt,
          place.dataUpdatedAt,
        )}
      />
      {slotTemplates.length === 0 && (
        <p className="border border-border rounded-xl bg-card p-6 text-center text-muted-foreground">
          ไม่พบแบบร่างของตำแหน่งงานนี้ กรุณาสร้างแบบร่างก่อนจัดเวรอัตโนมัติ
        </p>
      )}
      {staffPositions.length === 0 && (
        <p className="border border-border rounded-xl bg-card p-6 text-center text-muted-foreground">
          ไม่พบพนักงานของตำแหน่งงานนี้
          กรุณาเพิ่มพนักงานเข้าตำแหน่งงานก่อนจัดเวรอัตโนมัติ
        </p>
      )}
      {slotTemplates.length > 0 && staffPositions.length > 0 && (
        <AutoCreateForm
          positionId={positionId}
          slotTemplates={slotTemplates}
          staffPositions={staffPositions}
          placeTimezone={place.data.timezone}
          urlOnSuccess={`/work-schedule/admin/${placeId}/position/${positionId}/slot`}
          urlOnCancel={menuUrl}
        />
      )}
    </div>
  );
}
