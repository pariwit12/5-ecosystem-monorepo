// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { USER_ERROR_MESSAGES } from "@/constants/error-messages";

import { cn } from "@/lib/utils";

import Link from "next/link";

import Loading from "./loading";
import ErrorQuery from "./error";

import { ChildrenHeader } from "@/components/children-header";

// ===================
// Import Queries
// ===================

import { workScheduleSlotTemplateQueries } from "@/features/work-schedule/slot-template/work-schedule-slot-template.queries";

// ===================
// (จบ) Import Queries
// ===================

// ==========================================
// 🛡️ Component ดักจับ Error จาก URL
// ==========================================

function ToastNotifier() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get("error");

    if (!errorCode) return;

    if (errorCode === "invalid_id") {
      toast.error("รหัสแบบร่างไม่ถูกต้อง กรุณาเลือกแบบร่างใหม่");
    } else if (errorCode === ErrorCode.WORK_SCHEDULE_SLOT_TEMPLATE_NOT_FOUND) {
      const errorMessage = USER_ERROR_MESSAGES[errorCode];

      toast.error("ไม่พบแบบร่างที่เรียกใช้", {
        description: errorMessage,
      });
    }

    window.history.replaceState(null, "", window.location.pathname);
  }, [searchParams]);

  return null;
}

// ==========================================
// 🛡️ (จบ) Component ดักจับ Error จาก URL
// ==========================================

// ==========================================
// 🖥️ Component หลัก
// ==========================================

export default function WorkScheduleAdminPositionSlotNewPrefillClient({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  const router = useRouter();
  const { getToken, userId, isLoaded } = useAuth();

  // =================================
  // 🚀 ดึงข้อมูล Query
  // =================================

  const {
    //
    data: dataQuery,
    isLoading,
    isFetching,
    error: errorQuery,
    refetch,
    dataUpdatedAt,
    //
  } = useQuery(
    workScheduleSlotTemplateQueries.queryGetWorkScheduleSlotTemplatesByPositionId(
      //
      positionId,

      userId,
      getToken,

      [
        ErrorCode.PERSON_NOT_FOUND,
        ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND,
        ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
      ],
    ),
  );

  // =================================
  // 🚀 (จบ) ดึงข้อมูล Query
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

      if (
        [
          ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND,
          ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
        ].includes(errorCode)
      ) {
        router.push(
          `/work-schedule/admin/${placeId}/position?error=${errorCode}`,
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
  }, [errorQuery, router, dataQuery, placeId]);

  // ===============================================
  // 🌟 (จบ) ดักจับ Error (จาก Query) แล้ว Redirect
  // ===============================================

  // =================================================================================
  // Loading UI (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // =================================================================================

  // isLoaded คือ จาก useAuth (Clerk) ป้องกันจังหวะแรกที่ยังโหลด userId ไม่เสร็จ

  if (!isLoaded || isLoading) {
    return <Loading />;
  }

  // =================================================================================
  // (จบ) Loading UI (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // =================================================================================

  // ==================================================================================================
  // Flash UI (สำหรับ Redirect) (จำเป็นกรณี Client มี First Query  หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ==================================================================================================

  if (
    errorQuery &&
    dataQuery === undefined &&
    isAxiosError(errorQuery) &&
    [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
      ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
    ].includes(errorQuery.response?.data?.errorCode)
  ) {
    return <Loading />;
  }

  // ==================================================================================================
  // (จบ) Flash UI (สำหรับ Redirect) (จำเป็นกรณี Client มี First Query  หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ==================================================================================================

  // ===========================================================================================================
  // Early Return: หน้าจอ Error โหลดครั้งแรก (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ===========================================================================================================

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

  if (dataQuery === undefined) {
    return <Loading />;
  }

  // ===================================================
  // (จบ) ตรวจสอบความพร้อมข้อมูลที่ต้องใช้แสดงผลก่อนแสดงผลจริง
  // ===================================================

  // ==============================================================
  // จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // ==============================================================

  const slotTemplates = dataQuery.slotTemplates;

  // ==============================================================
  // (จบ) จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // ==============================================================

  // ===================================================
  // ส่วนแสดงผล UI หลัก (snippet จากใน template/page.tsx)
  // ===================================================

  return (
    <>
      <Suspense fallback={null}>
        <ToastNotifier />
      </Suspense>

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
          title={`เลือกรายการแบบร่าง`}
          description={`เลือกรายการแบบร่างที่ต้องการดึงข้อมูลมาใช้สำหรับสร้างตารางเวร`}
          backHref={`/work-schedule/admin/${placeId}/position/${positionId}/slot/new/menu`}
          //

          // กรณี: ใช้ status bar
          isFetching={isFetching}
          errorQuery={errorQuery}
          refetch={refetch}
          dataUpdatedAt={dataUpdatedAt}
          // (จบ) กรณี: ใช้ status bar
          //
        />

        {/* ========================================================= */}
        {/* ส่วนแสดงผล: Stacked List (สำหรับข้อมูลที่มี Column ไม่เยอะ) */}
        {/* ========================================================= */}

        <div className="w-full border border-gray-200 rounded-xl shadow-sm bg-white divide-y divide-gray-100">
          {slotTemplates.map((st) => (
            <div
              key={st.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4 hover:bg-gray-50/50 transition-colors"
            >
              {/*  */}
              {/* ================= */}
              {/* ฝั่งซ้าย: ข้อมูล */}
              {/* ================= */}

              <div className="flex items-center gap-4">
                {/*  */}
                {/* ================ */}
                {/* โลโก้แบบกลม */}
                {/* ================ */}

                <div className="w-10 h-10 shrink-0 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                  {st.name.charAt(0).toUpperCase()}
                </div>

                {/* ================ */}
                {/* (จบ) โลโก้แบบกลม */}
                {/* ================ */}

                {/* ========================== */}
                {/* รายละเอียด (ถัดจากโลโก้) */}
                {/* ========================== */}

                <div>
                  {/*  */}
                  {/* ====================== */}
                  {/* 🌟 ชื่อเต็มของรายการ */}
                  {/* ====================== */}

                  <h3 className="text-base font-semibold text-gray-800">
                    {st.name}
                  </h3>

                  {/* ====================== */}
                  {/* 🌟 (จบ) ชื่อเต็มของรายการ */}
                  {/* ====================== */}

                  {/* ================= */}
                  {/* 🌟 รายละเอียด */}
                  {/* ================= */}

                  <p className="text-sm text-gray-500 font-mono mt-0.5">
                    {/* 
                            -------- ปรับตามใช้งานจริง --------
                          */}
                    ID: {st.id.slice(0, 8)}...
                    {/* 
                            --------------------------------
                          */}
                  </p>

                  {/* ================= */}
                  {/* 🌟 (จบ) รายละเอียด */}
                  {/* ================= */}
                  {/*  */}
                </div>

                {/* ========================== */}
                {/* (จบ) รายละเอียด (ถัดจากโลโก้) */}
                {/* ========================== */}
                {/*  */}
              </div>

              {/* ================= */}
              {/* (จบ) ฝั่งซ้าย: ข้อมูล */}
              {/* ================= */}

              {/* ================== */}
              {/* ฝั่งขวา: Action */}
              {/* ================== */}

              <Link
                href={`/work-schedule/admin/${placeId}/position/${positionId}/slot/new?prefillId=${st.id}`}
                className="w-full sm:w-auto px-6 py-2 text-center font-medium rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                เลือก
              </Link>

              {/* ================== */}
              {/* (จบ) ฝั่งขวา: Action */}
              {/* ================== */}
              {/*  */}
            </div>
          ))}

          {/* ============================== */}
          {/* กรณีไม่มีข้อมูล (Empty State) */}
          {/* ============================== */}

          {slotTemplates.length === 0 && (
            <div className="py-6 text-sm text-center text-gray-500">
              ไม่พบข้อมูล
            </div>
          )}

          {/* ============================== */}
          {/* (จบ) กรณีไม่มีข้อมูล (Empty State) */}
          {/* ============================== */}
          {/*  */}
        </div>

        {/* ========================================================= */}
        {/* (จบ) ส่วนแสดงผล: Stacked List (สำหรับข้อมูลที่มี Column ไม่เยอะ) */}
        {/* ========================================================= */}
        {/*  */}
      </div>
    </>
  );
}
