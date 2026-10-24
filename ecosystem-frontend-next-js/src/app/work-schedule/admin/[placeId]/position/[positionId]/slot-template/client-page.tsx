// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { workScheduleSlotTemplateQueries } from "@/features/work-schedule/slot-template/work-schedule-slot-template.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdSlotTemplateErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

import ErrorQuery from "./error";

import Loading from "./loading";

import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Client({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
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
    workScheduleSlotTemplateQueries.queryGetSlotTemplatesByPositionId(
      positionId,

      userId,
      getToken,

      AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ),
  );

  const { isRedirecting, targetUrl, errorCode } = useEffectCheckError(
    errorQuery,
    workScheduleAdminPlaceIdPositionPositionIdSlotTemplateErrorCodeRedirectList,
    dataQuery,
  );

  if (isRedirecting && targetUrl && errorCode) {
    return <RedirectUI targetUrl={targetUrl} errorCode={errorCode} />;
  }

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  if (!isLoaded || isLoading || dataQuery === undefined) {
    return <Loading />;
  }

  const slotTemplates = dataQuery.slotTemplates;

  // แปลงเวลาไว้แสดงเวลา Update ล่าสุด
  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

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

              "text-muted-foreground bg-secondary hover:bg-accent transition",
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
                "text-foreground",
              )}
            >
              รายการ slotTemplate
            </h2>

            <p
              className={cn(
                "text-xs sm:text-sm",

                "truncate",

                "font-mono",
                "text-muted-foreground",
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

              "text-primary-foreground",
              "bg-primary",
              "hover:bg-primary/90",
              "active:bg-primary",
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

                  "text-muted-foreground animate-pulse",
                )}
              >
                <svg
                  className={cn(
                    "h-3.5 w-3.5",

                    "animate-spin text-primary",
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

                    "font-medium text-destructive",
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
                    "text-primary hover:text-primary transition-colors",
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

                      "text-muted-foreground",
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

                      "font-medium text-muted-foreground hover:text-muted-foreground cursor-pointer transition-colors",
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

      <div className="w-full border border-border rounded-xl shadow-sm bg-card divide-y divide-border">
        {slotTemplates.map((st) => (
          <div
            key={st.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4 hover:bg-muted/50 transition-colors"
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

              <div className="w-10 h-10 shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-lg">
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

                <h3 className="text-base font-semibold text-foreground">
                  {st.name}
                </h3>

                {/* ====================== */}
                {/* 🌟 (จบ) ชื่อเต็มของรายการ */}
                {/* ====================== */}

                {/* ================= */}
                {/* 🌟 รายละเอียด */}
                {/* ================= */}

                <p className="text-sm text-muted-foreground font-mono mt-0.5">
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
              className="min-h-11 w-full sm:w-auto px-6 py-2 text-center font-medium rounded-lg transition-colors bg-secondary text-secondary-foreground hover:bg-accent"
            >
              เลือก
            </Link>

            {/* ================== */}
            {/* (จบ) ฝั่งขวา: Action */}
            {/* ================== */}
            {/*  */}
          </div>
        ))}

        {slotTemplates.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">ไม่พบข้อมูล</div>
        )}
      </div>

      {/* ========================================================= */}
      {/* (จบ) ส่วนแสดงผล: Stacked List (สำหรับข้อมูลที่มี Column ไม่เยอะ) */}
      {/* ========================================================= */}
      {/*  */}
    </div>
  );
}
