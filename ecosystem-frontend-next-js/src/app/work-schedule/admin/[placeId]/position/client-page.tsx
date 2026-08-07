// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

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

export default function Client({ placeId }: { placeId: string }) {
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
    workSchedulePositionQueries.queryGetWorkSchedulePositionsByPlaceId(
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

  useEffect(() => {
    if (errorQuery && isAxiosError(errorQuery)) {
      const errorCode = errorQuery.response?.data?.errorCode;

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

    if (errorQuery && dataQuery !== undefined) {
      toast.error(
        "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
      );
    }
  }, [errorQuery, router, dataQuery]);

  if (!isLoaded || isLoading) {
    return <Loading />;
  }

  if (
    errorQuery &&
    dataQuery === undefined &&
    isAxiosError(errorQuery) &&
    [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
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

  const positions = dataQuery.positions;

  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
      {/*  */}
      {/* ============================== */}
      {/* ส่วนหัวข้อ + สถานะ fetching */}
      {/* ============================== */}

      <div>
        {/*  */}
        {/* =================================================================== */}
        {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มแก้ไขข้อมูล (ขวาสุด) */}
        {/* =================================================================== */}

        <div className="flex items-center gap-4 border-b pb-6">
          {/*  */}
          {/* ========================== */}
          {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด) */}
          {/* ========================== */}

          <Link
            href={`/work-schedule/admin/${placeId}`}
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
              {/*  */}
              <h2 // หัวข้อ
                className="text-3xl font-bold text-gray-800"
              >
                รายการตำแหน่งงาน
              </h2>

              <p // รายละเอียด (ใต้หัวข้อ) เช่น ชื่อองค์กรที่สังกัด
                className="text-gray-500 mt-1 font-mono text-sm"
              >
                จัดการและตรวจสอบข้อมูลรายการทั้งหมดในระบบ
              </p>
              {/*  */}
            </div>

            {/* ============================= */}
            {/* 🟢 (จบ) กลุ่มของส่วนหัวข้อ (ซ้าย) */}
            {/* ============================= */}

            {/* หากต้องมีทั้งปุ่ม "สร้าง" และ "แก้ไข" พร้อมกัน ต้องใส่ div ครอบอีกที ไม่งั้นจะมีตัวนึงถูกดีดมาไว้ตรงกลาง */}

            {/* ======================== */}
            {/* Create Button (ขวา) */}
            {/* ======================== */}

            <Link
              href={`/work-schedule/admin/${placeId}/position/new`}
              className="inline-flex items-center justify-center px-5 py-2.5 font-medium text-sm text-white bg-blue-500 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-colors shrink-0"
            >
              <span>+ สร้างข้อมูลใหม่</span>
            </Link>

            {/* ======================== */}
            {/* (จบ) Create Button (ขวา) */}
            {/* ======================== */}
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

      {/* ========================================================= */}
      {/* ส่วนแสดงผล: Stacked List (สำหรับข้อมูลที่มี Column ไม่เยอะ) */}
      {/* ========================================================= */}

      <div className="w-full border border-gray-200 rounded-xl shadow-sm bg-white divide-y divide-gray-100">
        {positions.map((p) => (
          <div
            key={p.id}
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
                {p.name.charAt(0).toUpperCase()}
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
                  {p.name}
                </h3>

                {/* ====================== */}
                {/* 🌟 (จบ) ชื่อเต็มของรายการ */}
                {/* ====================== */}

                {/* ================= */}
                {/* 🌟 รายละเอียด */}
                {/* ================= */}

                <p className="text-sm text-gray-500 font-mono mt-0.5">
                  ID: {p.id.slice(0, 8)}...
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
              href={`/work-schedule/admin/${placeId}/position/${p.id}`}
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

        {positions.length === 0 && (
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

      {/* ============================ */}
      {/* 🌟 (จบ) เนื้อหาหลักตรงนี้ */}
      {/* ============================ */}
      {/*  */}
    </div>
  );
}
