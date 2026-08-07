"use client";

import Link from "next/link";
import { CreateWorkScheduleStaffForm } from "@/features/work-schedule/staff/components/create-work-schedule-staff-form";

export default function Client({ placeId }: { placeId: string }) {
  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
      {/* 🟢 ส่วนหัวข้อ และปุ่มย้อนกลับ */}
      <div className="flex items-center gap-4 border-b pb-6">
        <Link
          href={`/work-schedule/admin/${placeId}/staff`}
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

        <div className="flex-1 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              เพิ่มพนักงานใหม่
            </h2>
            <p className="text-gray-500 mt-1 font-mono text-sm">
              กรอกข้อมูลพนักงานเพื่อเพิ่มเข้าสู่ระบบจัดตารางงาน
            </p>
          </div>
        </div>
      </div>

      <CreateWorkScheduleStaffForm placeId={placeId} />
    </div>
  );
}
