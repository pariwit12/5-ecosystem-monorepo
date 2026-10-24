"use client";

import Link from "next/link";
import { CreateWorkScheduleStaffForm } from "@/features/work-schedule/staff/components/create-work-schedule-staff-form";

export default function Client({ placeId }: { placeId: string }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
      {/* 🟢 ส่วนหัวข้อ และปุ่มย้อนกลับ */}
      <div className="flex flex-wrap items-start gap-3 border-b pb-6 sm:items-center sm:gap-4">
        <Link
          href={`/work-schedule/admin/${placeId}/staff`}
          className="min-h-11 min-w-11 p-2 bg-muted text-muted-foreground rounded-full hover:bg-muted transition"
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

        <div className="min-w-0 flex-1">
          <div>
            <h2 className="break-words text-2xl font-bold text-foreground sm:text-3xl">
              เพิ่มพนักงานใหม่
            </h2>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              กรอกข้อมูลพนักงานเพื่อเพิ่มเข้าสู่ระบบจัดตารางงาน
            </p>
          </div>
        </div>
      </div>

      <CreateWorkScheduleStaffForm placeId={placeId} />
    </div>
  );
}
