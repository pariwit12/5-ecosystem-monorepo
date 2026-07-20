// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

import { cn } from "@/lib/utils";

import Loading from "./loading";
import ErrorQuery from "./error";

import { ChildrenHeader } from "@/components/children-header";

import { CreateWorkScheduleSlotForm } from "@/features/work-schedule/slot/components/create-work-schedule-slot-form";

// ===================
// Import Queries
// ===================

import { workSchedulePlaceQueries } from "@/features/work-schedule/place/work-schedule-place.queries";
import { workScheduleSlotTemplateQueries } from "@/features/work-schedule/slot-template/work-schedule-slot-template.queries";

// ===================
// (จบ) Import Queries
// ===================

// ==========================================
// 🖥️ Component หลัก
// ==========================================

export default function WorkScheduleAdminPositionSlotNewClient({
  placeId,
  positionId,
  prefillId,
}: {
  placeId: string;
  positionId: string;
  prefillId?: string;
}) {
  const router = useRouter();
  const { getToken, userId, isLoaded } = useAuth();

  // =================================
  // 🚀 ดึงข้อมูล Query (Place สำหรับ timezone)
  // =================================

  const {
    data: dataQueryPlace,
    isLoading: isLoadingPlace,
    // eslint-disable-next-line
    isFetching: isFetchingPlace,
    error: errorQueryPlace,
    refetch: refetchPlace,
    // eslint-disable-next-line
    dataUpdatedAt: dataUpdatedAtPlace,
  } = useQuery(
    workSchedulePlaceQueries.queryGetWorkSchedulePlaceById(
      placeId,

      userId,
      getToken,

      [
        ErrorCode.PERSON_NOT_FOUND,

        ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
        ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
      ],
    ),
  );

  // =================================
  // 🚀 (จบ) ดึงข้อมูล Query (Place สำหรับ timezone)
  // =================================

  // ===============================================
  // 🌟 ดักจับ Error (จาก Query) แล้ว Redirect
  // ===============================================

  useEffect(() => {
    if (errorQueryPlace && isAxiosError(errorQueryPlace)) {
      const errorCode = errorQueryPlace.response?.data?.errorCode;

      if ([ErrorCode.PERSON_NOT_FOUND].includes(errorCode)) {
        router.push(`/person/new?error=${errorCode}`);

        return;
      }

      if (
        [
          ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
          ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
          ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        ].includes(errorCode)
      ) {
        router.push(`/work-schedule?error=${errorCode}`);

        return;
      }
    }

    // =================================================
    // Error จากการ fetching ที่ผ่านตรวจสอบ redirect แล้ว
    // =================================================

    if (errorQueryPlace && dataQueryPlace !== undefined) {
      toast.error(
        "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
      );
    }
    //
  }, [errorQueryPlace, router, dataQueryPlace]);

  // ===============================================
  // 🌟 (จบ) ดักจับ Error (จาก Query) แล้ว Redirect
  // ===============================================

  // =================================
  // 🚀 ดึงข้อมูล Query (pre-fill)
  // =================================

  const {
    data: dataQuery,
    isLoading,
    isFetching,
    error: errorQuery,
    refetch,
    dataUpdatedAt,
  } = useQuery(
    workScheduleSlotTemplateQueries.queryGetWorkScheduleSlotTemplateById(
      prefillId ?? "",

      userId,
      getToken,

      [
        ErrorCode.PERSON_NOT_FOUND,

        ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,

        ErrorCode.WORK_SCHEDULE_POSITION_DELETED,

        ErrorCode.WORK_SCHEDULE_SLOT_TEMPLATE_NOT_FOUND,
      ],
    ),
  );

  // =================================
  // 🚀 (จบ) ดึงข้อมูล Query (pre-fill)
  // =================================

  // ===============================================
  // 🌟 ดักจับ Error (จาก Query) แล้ว Redirect
  // ===============================================

  useEffect(() => {
    if (errorQuery && isAxiosError(errorQuery)) {
      const errorCode = errorQuery.response?.data?.errorCode;

      if ([ErrorCode.PERSON_NOT_FOUND].includes(errorCode)) {
        router.push(`/person/new?error=${errorCode}`);

        return;
      }

      if (
        [
          ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
          ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        ].includes(errorCode)
      ) {
        router.push(`/work-schedule?error=${errorCode}`);

        return;
      }

      if ([ErrorCode.WORK_SCHEDULE_POSITION_DELETED].includes(errorCode)) {
        router.push(
          `/work-schedule/admin/${placeId}/position?error=${errorCode}`,
        );

        return;
      }

      if (
        [ErrorCode.WORK_SCHEDULE_SLOT_TEMPLATE_NOT_FOUND].includes(errorCode)
      ) {
        router.push(
          `/work-schedule/admin/${placeId}/position/${positionId}/slot/new/pre-fill?error=${errorCode}`,
        );

        return;
      }
    }

    // =================================================
    // Error จากการ fetching ที่ผ่านตรวจสอบ redirect แล้ว
    // =================================================

    if (errorQuery && dataQuery !== undefined) {
      toast.error(
        "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
      );
    }
    //
  }, [errorQuery, router, dataQuery, placeId, positionId]);

  // ===============================================
  // 🌟 (จบ) ดักจับ Error (จาก Query) แล้ว Redirect
  // ===============================================

  // =================================================================================
  // Loading UI (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // =================================================================================

  if (!isLoaded || isLoading || isLoadingPlace) {
    return <Loading />;
  }

  // =================================================================================
  // (จบ) Loading UI (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // =================================================================================

  // ==================================================================================================
  // Flash UI (สำหรับ Redirect) (จำเป็นกรณี Client มี First Query  หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ==================================================================================================

  if (
    (errorQueryPlace &&
      dataQueryPlace === undefined &&
      isAxiosError(errorQueryPlace) &&
      [
        ErrorCode.PERSON_NOT_FOUND,

        ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
        ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
      ].includes(errorQueryPlace.response?.data?.errorCode)) ||
    (errorQuery &&
      dataQuery === undefined &&
      isAxiosError(errorQuery) &&
      [
        ErrorCode.PERSON_NOT_FOUND,

        ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,

        ErrorCode.WORK_SCHEDULE_POSITION_DELETED,

        ErrorCode.WORK_SCHEDULE_SLOT_TEMPLATE_NOT_FOUND,
      ].includes(errorQuery.response?.data?.errorCode))
  ) {
    return <Loading />;
  }

  // ==================================================================================================
  // (จบ) Flash UI (สำหรับ Redirect) (จำเป็นกรณี Client มี First Query  หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ==================================================================================================

  // ===========================================================================================================
  // Early Return: หน้าจอ Error โหลดครั้งแรก (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ===========================================================================================================

  if (errorQueryPlace && dataQueryPlace === undefined) {
    return <ErrorQuery reset={() => refetchPlace()} />;
  }

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  // ===========================================================================================================
  // (จบ) Early Return: หน้าจอ Error โหลดครั้งแรก (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ===========================================================================================================

  // ============================
  // 🎯 ฟังก์ชันเฉพาะของหน้า
  // ============================

  // ============================
  // 🎯 (จบ) ฟังก์ชันเฉพาะของหน้า
  // ============================

  // ===================================================
  // ตรวจสอบความพร้อมข้อมูลที่ต้องใช้แสดงผลก่อนแสดงผลจริง
  // ===================================================

  if (
    dataQueryPlace === undefined ||
    (prefillId !== undefined && dataQuery === undefined)
  ) {
    return <Loading />;
  }

  // ===================================================
  // (จบ) ตรวจสอบความพร้อมข้อมูลที่ต้องใช้แสดงผลก่อนแสดงผลจริง
  // ===================================================

  // ==============================================================
  // จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // ==============================================================

  const place = dataQueryPlace;
  const slotTemplate = dataQuery;

  // ==============================================================
  // (จบ) จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // ==============================================================

  // ===================================================
  // ส่วนแสดงผล UI หลัก (snippet จากใน template/page.tsx)
  // ===================================================

  return (
    <>
      {/* ========================================================================================== */}
      {/* Main UI (children) */}
      {/* ========================================================================================== */}

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

        <CreateWorkScheduleSlotForm
          positionId={positionId}
          placeTimezone={place.timezone}
          prefillName={slotTemplate?.name}
          prefillStartTime={slotTemplate?.startTime}
          prefillDurationMinute={slotTemplate?.durationMinute}
          prefillQuantity={slotTemplate?.quantity}
          urlOnSuccess={`/work-schedule/admin/${placeId}/position/${positionId}/slot`}
          urlOnCancel={`/work-schedule/admin/${placeId}/position/${positionId}/slot/new/menu`}
          skipErrorCodes={[]}
          className=""
        />
      </div>

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
      {/*  */}
    </>
  );
}
