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

import { workSchedulePositionQueries } from "@/features/work-schedule/position/work-schedule-position.queries";

export default function WorkScheduleAdminPositionIdClient({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  const router = useRouter();
  const { getToken, userId, isLoaded } = useAuth();

  const {
    data: dataQuery,
    isLoading,
    isFetching,
    error: errorQuery,
    refetch,
    dataUpdatedAt,
  } = useQuery(
    workSchedulePositionQueries.queryGetWorkSchedulePositionById(
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

    if (errorQuery && dataQuery !== undefined) {
      toast.error(
        "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
      );
    }
  }, [errorQuery, router, dataQuery, placeId]);

  if (!isLoaded || isLoading) {
    return <Loading />;
  }

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

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (dataQuery === undefined) {
    return <Loading />;
  }

  const position = dataQuery;

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
          {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มแก้ไขข้อมูล (ขวาสุด) */}
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
              href={`/work-schedule/admin/${placeId}/position`}
              className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
            {/* 🟢 ส่วนหัวข้อ (ซ้าย) และ ปุ่มแก้ไขข้อมูล (ขวา) */}
            {/* ============================================ */}

            <div className="flex-1 flex items-center justify-between">
              {/*  */}
              {/* ============================= */}
              {/* 🟢 กลุ่มของส่วนหัวข้อ (ซ้าย) */}
              {/* ============================= */}

              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  {position.name}
                </h2>

                <p className="text-gray-500 mt-1 font-mono text-sm">
                  เลือกเมนูที่ต้องการจัดการหรือเข้าถึง
                </p>
              </div>

              {/* ============================= */}
              {/* 🟢 (จบ) กลุ่มของส่วนหัวข้อ (ซ้าย) */}
              {/* ============================= */}
              {/*  */}
            </div>

            {/* ============================================ */}
            {/* 🟢 (จบ) ส่วนหัวข้อ (ซ้าย) และ ปุ่มแก้ไขข้อมูล (ขวา) */}
            {/* ============================================ */}
            {/*  */}
          </div>

          {/* =================================================================== */}
          {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มแก้ไขข้อมูล (ขวาสุด) */}
          {/* =================================================================== */}

          {/* ====================== */}
          {/* 🌟 แถบสถานะข้อมูล */}
          {/* ====================== */}

          <div className="flex justify-end items-center h-6 mb-2 text-xs">
            {
              // =================================
              // UI Fetching - กำลังอัปเดตข้อมูล
              // =================================

              isFetching ? (
                <span className="text-gray-500 flex items-center gap-2 animate-pulse">
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-blue-500"
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
                <div className="flex items-center gap-2">
                  <span className="text-red-500 flex items-center gap-1.5 font-medium">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
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
                    className="text-blue-600 hover:text-blue-700 font-semibold underline cursor-pointer transition-colors"
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
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-green-500"
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
                      className="text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer transition-colors font-medium"
                      title="กดเพื่ออัปเดตข้อมูลใหม่"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
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

        {/* ============================ */}
        {/* 🌟 เนื้อหาหลักตรงนี้ */}
        {/* ============================ */}

        {/* ==================================== */}
        {/* 🌟 โซนเมนูการทำงาน (การ์ด - Grid) */}
        {/* ==================================== */}

        <div
          className={cn(
            "flex",
            "flex-col",

            "gap-2 sm:gap-3",
          )}
        >
          <h3
            className={cn(
              "text-lg",

              "font-bold text-gray-800",
            )}
          >
            เมนูการจัดการ
          </h3>

          <div
            className={cn(
              "grid",
              "grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))]",

              "gap-2 sm:gap-3",
            )}
          >
            {/* ==================================== */}
            {/* เมนู: สีหลัก (เน้น หรือ ใช้งานบ่อยสุด) */}
            {/* ==================================== */}

            <Link
              href={`/work-schedule/admin/${placeId}/position/${positionId}/slot`}
              className={cn(
                "group",

                "flex",
                "flex-col",

                "items-center",
                "text-center",

                "px-4",
                "py-6",

                "relative",

                "overflow-hidden",

                "border-2",
                "rounded-2xl",

                "bg-blue-50/50",
                "border-blue-100",

                "cursor-pointer",

                "transition-all",
                "hover:bg-blue-50",
                "hover:border-blue-300",
                "hover:shadow-md",
              )}
            >
              <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4
                className={cn(
                  "text-lg",

                  "font-bold",

                  "text-gray-900",
                  "group-hover:text-blue-700",
                  "transition-colors",
                )}
              >
                ตารางเวร
              </h4>
              <p
                className={cn(
                  "text-sm",

                  "text-gray-500",

                  "mt-1",
                )}
              >
                จัดการและตรวจสอบตารางเวรของ{position.name}
              </p>
            </Link>

            {/* ==================================== */}
            {/* (จบ) เมนู: สีหลัก (เน้น หรือ ใช้งานบ่อยสุด) */}
            {/* ==================================== */}

            {/* ========================= */}
            {/* เมนูมาตรฐาน: แบบร่าง */}
            {/* ========================= */}

            <Link
              href={`/work-schedule/admin/${placeId}/position/${positionId}/slot-template`}
              className={cn(
                "group",

                "flex",
                "flex-col",

                "items-center",
                "text-center",

                "px-4",
                "py-6",

                "relative",

                "overflow-hidden",

                "border",
                "rounded-2xl",

                "bg-white",
                "border-gray-200",

                "cursor-pointer",

                "transition-all",
                "hover:bg-gray-50",
                "hover:border-gray-300",
                "hover:shadow-md",
              )}
            >
              <div
                className={cn(
                  "w-12 h-12",
                  "rounded-xl",

                  "flex",
                  "items-center",
                  "justify-center",

                  "bg-gray-100",
                  "text-gray-600",

                  "transition-all",
                  "group-hover:bg-white",
                  "group-hover:shadow-sm",

                  "shrink-0",

                  "mb-4",
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4
                className={cn(
                  "text-lg",

                  "font-bold",

                  "text-gray-800",
                )}
              >
                แบบร่าง
              </h4>
              <p
                className={cn(
                  "text-sm",

                  "text-gray-500",

                  "mt-1",
                )}
              >
                จัดการและตรวจสอบข้อมูลแบบร่างสำหรับตารางเวรของ{position.name}
              </p>
            </Link>

            {/* ========================= */}
            {/* (จบ) เมนูมาตรฐาน: แบบร่าง */}
            {/* ========================= */}

            {/* ========================= */}
            {/* เมนูมาตรฐาน: พนักงาน */}
            {/* ========================= */}

            <Link
              href={`/work-schedule/admin/${placeId}/position/${positionId}/staff-position`}
              className={cn(
                "group",

                "flex",
                "flex-col",

                "items-center",
                "text-center",

                "px-4",
                "py-6",

                "relative",

                "overflow-hidden",

                "border",
                "rounded-2xl",

                "bg-white",
                "border-gray-200",

                "cursor-pointer",

                "transition-all",
                "hover:bg-gray-50",
                "hover:border-gray-300",
                "hover:shadow-md",
              )}
            >
              <div
                className={cn(
                  "w-12 h-12",
                  "rounded-xl",

                  "flex",
                  "items-center",
                  "justify-center",

                  "bg-gray-100",
                  "text-gray-600",

                  "transition-all",
                  "group-hover:bg-white",
                  "group-hover:shadow-sm",

                  "shrink-0",

                  "mb-4",
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h4
                className={cn(
                  "text-lg",

                  "font-bold",

                  "text-gray-800",
                )}
              >
                พนักงาน
              </h4>
              <p
                className={cn(
                  "text-sm",

                  "text-gray-500",

                  "mt-1",
                )}
              >
                จัดการและตรวจสอบข้อมูลพนักงานของ{position.name}
              </p>
            </Link>

            {/* ========================= */}
            {/* (จบ) เมนูมาตรฐาน: พนักงาน */}
            {/* ========================= */}
            {/*  */}
          </div>
        </div>

        {/* ==================================== */}
        {/* 🌟 (จบ) โซนเมนูการทำงาน (การ์ด - Grid) */}
        {/* ==================================== */}

        {/* ============================ */}
        {/* 🌟 (จบ) เนื้อหาหลักตรงนี้ */}
        {/* ============================ */}
        {/*  */}
      </div>

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
    </>
  );
}
