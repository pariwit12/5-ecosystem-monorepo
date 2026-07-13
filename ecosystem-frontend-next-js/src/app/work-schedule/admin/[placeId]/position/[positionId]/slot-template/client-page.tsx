// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import Loading from "./loading";
import ErrorQuery from "./error";

// ===================
// Import Queries
// ===================

import { workScheduleSlotTemplateQueries } from "@/features/work-schedule/slot-template/work-schedule-slot-template.queries";

// ===================
// (จบ) Import Queries
// ===================

// ==========================================
// 🖥️ Component หลัก
// ==========================================

export default function WorkScheduleAdminPositionSlotTemplateClient({
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
    data: dataQuery,
    isLoading,
    isFetching,
    error: errorQuery,
    refetch,
    dataUpdatedAt,
  } = useQuery(
    workScheduleSlotTemplateQueries.queryGetWorkScheduleSlotTemplatesByPositionId(
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
  }, [errorQuery, router, dataQuery, placeId]);

  // ===============================================
  // 🌟 (จบ) ดักจับ Error (จาก Query) แล้ว Redirect
  // ===============================================

  // =================================================================================
  // Loading UI (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // =================================================================================

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

  // แปลงเวลาไว้แสดงเวลา Update ล่าสุด
  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

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
      {/* ========================================================================================== */}
      {/* Main UI (children) */}
      {/* ========================================================================================== */}

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
        {/*  */}
        {/* ============================== */}
        {/* ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

        <div>
          {/*  */}
          {/* =================================================================== */}
          {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มสร้างข้อมูล (ขวาสุด) */}
          {/* =================================================================== */}

          <div
            className={cn(
              "flex",
              "flex-wrap",
              "items-center",
              "justify-between",

              "gap-2 sm:gap-3",
              "pb-4 sm:pb-4",

              "border-b",
            )}
          >
            {/*  */}
            {/* ========================== */}
            {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด) */}
            {/* ========================== */}
            <Link
              href={`/work-schedule/admin/${placeId}/position/${positionId}`}
              className={cn(
                "p-2", // เพื่อให้ตัวไอคอนลูกศรไม่เบียดขอบเขตของปุ่มจนเกินไป

                "rounded-full",
                // rounded-full + icon (h = w) + p-2 = ปุ่มกลายเป็น "วงกลม" ที่สมบูรณ์แบบครับ

                "text-gray-600 bg-gray-100 hover:bg-gray-200 transition",
              )}
            >
              <svg
                className={cn("h-6 w-6")}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>

            {/* ========================== */}
            {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด) */}
            {/* ========================== */}

            {/* ============================================ */}
            {/* 🟢 ส่วนหัวข้อ */}
            {/* ============================================ */}

            <div
              className={cn(
                "flex-1",

                "min-w-0", // เปิดทางให้กล่องลูกสามารถใช้ truncate ได้

                "gap-4 sm:gap-6",
              )}
            >
              {/*  */}
              {/* ============================= */}
              {/* 🟢 กลุ่มของส่วนหัวข้อ (ซ้าย) */}
              {/* ============================= */}
              {/*  */}
              <h2
                className={cn(
                  "text-2xl sm:text-3xl",

                  "truncate",

                  "font-bold",
                  "text-gray-800",
                )}
              >
                รายการ slotTemplate
              </h2>

              <p
                className={cn(
                  "text-xs sm:text-sm",

                  "truncate",

                  "font-mono",
                  "text-gray-500",
                )}
              >
                จัดการและตรวจสอบข้อมูลรายการทั้งหมดในระบบ
              </p>

              {/* ============================= */}
              {/* 🟢 (จบ) ส่วนหัวข้อ */}
              {/* ============================= */}
              {/*  */}
            </div>

            {/* ======================== */}
            {/* Create Button (ขวา) */}
            {/* ======================== */}

            <Link
              href={`/work-schedule/admin/${placeId}/position/${positionId}/slot-template/new`}
              className={cn(
                // ทำให้ปุ่มหน้าตาเป็นปุ่ม
                "p-2 sm:px-4 sm:py-2",
                "rounded-full sm:rounded-xl",

                "text-white",
                "bg-blue-500",
                "hover:bg-blue-700",
                "active:bg-blue-800",
                "shadow-sm",
                "transition-colors",
              )}
            >
              <svg
                className={cn(
                  "h-6 w-6",

                  "sm:hidden",
                )}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>

              <span
                className={cn(
                  "hidden sm:block",

                  "text-xs sm:text-sm",

                  "truncate",

                  "font-medium",
                )}
              >
                + สร้างข้อมูลใหม่ / สร้าง slotTemplate ใหม่
              </span>
            </Link>

            {/* ======================== */}
            {/* (จบ) Create Button (ขวา) */}
            {/* ======================== */}
            {/*  */}
          </div>

          {/* =================================================================== */}
          {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มสร้างข้อมูล (ขวาสุด) */}
          {/* =================================================================== */}

          {/* ====================== */}
          {/* 🌟 แถบสถานะข้อมูล */}
          {/* ====================== */}

          <div
            className={cn(
              "flex",
              "flex-wrap",
              "items-center",
              "justify-end",

              "h-6", // fix ขนาด เพื่อให้หน้าจอไม่กระตุกเวลาเปลี่ยนสถานะ

              "text-xs",
            )}
          >
            {
              // =================================
              // UI Fetching - กำลังอัปเดตข้อมูล
              // =================================

              isFetching ? (
                <span
                  className={cn(
                    "flex",
                    "flex-wrap",
                    "items-center",

                    "gap-2",

                    "text-gray-500 animate-pulse",
                  )}
                >
                  <svg
                    className={cn(
                      "h-3.5 w-3.5",

                      "animate-spin text-blue-500",
                    )}
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  กำลังอัปเดตข้อมูล...
                </span>
              ) : //

              // =================================
              // (จบ) UI Fetching - กำลังอัปเดตข้อมูล
              // =================================

              // ======================
              // UI Error Fetched
              // ======================

              errorQuery ? (
                <div
                  className={cn(
                    "flex",
                    "flex-wrap",
                    "items-center",

                    "gap-2",
                  )}
                >
                  <span
                    className={cn(
                      "flex",
                      "flex-wrap",
                      "items-center",

                      "gap-1.5",

                      "font-medium text-red-500",
                    )}
                  >
                    <svg
                      className={cn("h-3.5 w-3.5")}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    อัปเดตล่าสุดไม่สำเร็จ
                  </span>

                  <button
                    type="button"
                    onClick={() => refetch()}
                    className={cn(
                      "font-semibold underline",
                      "text-blue-600 hover:text-blue-700 transition-colors",
                      "cursor-pointer",
                    )}
                  >
                    ลองใหม่
                  </button>
                </div>
              ) : (
                //
                // ======================
                // (จบ) UI Error Fetched
                // ======================

                // ======================
                // UI Fetch Success
                // ======================

                dataUpdatedAt > 0 && (
                  <div
                    className={cn(
                      "flex",
                      "flex-wrap",
                      "items-center",

                      "gap-3",
                    )}
                  >
                    <span
                      className={cn(
                        "flex",
                        "flex-wrap",
                        "items-center",

                        "gap-1.5",

                        "text-gray-400",
                      )}
                    >
                      <svg
                        className={cn(
                          "h-3.5 w-3.5",

                          "text-green-500",
                        )}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      อัปเดตล่าสุดเมื่อ: {formatLastUpdate(dataUpdatedAt)}
                    </span>

                    {/* ปุ่มรีเฟรชข้อมูลแบบแมนนวล */}
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className={cn(
                        "flex",
                        "flex-wrap",
                        "items-center",

                        "gap-1",

                        "font-medium text-gray-400 hover:text-gray-600 cursor-pointer transition-colors",
                      )}
                      title="กดเพื่ออัปเดตข้อมูลใหม่"
                    >
                      <svg
                        className={cn("h-3.5 w-3.5")}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17"
                        />
                      </svg>
                      รีเฟรช
                    </button>
                  </div>
                )

                // ======================
                // (จบ) UI Fetch Success
                // ======================
                //
              )
            }
          </div>

          {/* ====================== */}
          {/* 🌟 (จบ) แถบสถานะข้อมูล */}
          {/* ====================== */}
          {/*  */}
        </div>

        {/* ============================== */}
        {/* (จบ) ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

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
                    ID: {st.id.slice(0, 8)}...
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
                href={`/work-schedule/admin/${placeId}/position/${positionId}/slot-template/${st.id}`}
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
            <div className="py-12 text-center text-gray-500">ไม่พบข้อมูล</div>
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

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
      {/*  */}
    </>
  );
}
