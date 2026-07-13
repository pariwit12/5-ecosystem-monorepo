// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { CreateWorkScheduleSlotTemplateForm } from "@/features/work-schedule/slot-template/components/create-work-schedule-slot-template-form";

// ==========================================
// 🖥️ Component หลัก
// ==========================================

export default function WorkScheduleAdminPositionSlotTemplateNewClient({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  return (
    <>
      {/* ========================================================================================== */}
      {/* Main UI (children) */}
      {/* ========================================================================================== */}

      <div
        className={cn(
          //
          "w-full",
          "max-w-7xl",

          "mx-auto",

          "flex",
          "flex-col",
          "gap-2 sm:gap-3",

          "relative",

          "px-4 sm:px-6",
          "py-4 sm:py-6",
          //
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
              //
              "flex",
              "flex-wrap",
              "items-center",
              "justify-between",

              "gap-2 sm:gap-3",
              "pb-4 sm:pb-4",

              "border-b",
              //
            )}
          >
            {/*  */}
            {/* ========================== */}
            {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด) */}
            {/* ========================== */}
            <Link
              href={`/work-schedule/admin/${placeId}/position/${positionId}/slot-template`}
              className={cn(
                //
                "p-2", // เพื่อให้ตัวไอคอนลูกศรไม่เบียดขอบเขตของปุ่มจนเกินไป

                "rounded-full",
                // rounded-full + icon (h = w) + p-2 = ปุ่มกลายเป็น "วงกลม" ที่สมบูรณ์แบบครับ

                "text-gray-600 bg-gray-100 hover:bg-gray-200 transition",
                //
              )}
            >
              <svg
                className={cn(
                  //
                  "h-6 w-6",
                  //
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
                //
                "flex-1",

                "min-w-0", // เปิดทางให้กล่องลูกสามารถใช้ truncate ได้

                "gap-4 sm:gap-6",
                //
              )}
            >
              {/*  */}
              {/* ============================= */}
              {/* 🟢 กลุ่มของส่วนหัวข้อ (ซ้าย) */}
              {/* ============================= */}
              {/*  */}
              <h2
                className={cn(
                  //
                  "text-2xl sm:text-3xl",

                  "truncate",

                  "font-bold",
                  "text-gray-800",
                  //
                )}
              >
                สร้าง slotTemplate ใหม่
              </h2>

              <p
                className={cn(
                  //
                  "text-xs sm:text-sm",

                  "truncate",

                  "font-mono",
                  "text-gray-500",
                  //
                )}
              >
                กรอกรายละเอียดและบันทึกเพื่อดำเนินการต่อ
              </p>
              {/*  */}

              {/* ============================= */}
              {/* 🟢 (จบ) ส่วนหัวข้อ */}
              {/* ============================= */}
              {/*  */}
            </div>
          </div>

          {/* =================================================================== */}
          {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มสร้างข้อมูล (ขวาสุด) */}
          {/* =================================================================== */}
          {/*  */}
        </div>

        {/* ============================== */}
        {/* (จบ) ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

        {/* ===================== */}
        {/* ส่วนแสดงผล: Form */}
        {/* ===================== */}

        <CreateWorkScheduleSlotTemplateForm
          positionId={positionId}
          urlOnSuccess={`/work-schedule/admin/${placeId}/position/${positionId}/slot-template`}
          urlOnCancel={`/work-schedule/admin/${placeId}/position/${positionId}/slot-template`}
          skipErrorCodes={[]}
          className=""
        />

        {/* ===================== */}
        {/* (จบ) ส่วนแสดงผล: Form */}
        {/* ===================== */}
        {/*  */}
      </div>

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
      {/*  */}
    </>
  );
}
