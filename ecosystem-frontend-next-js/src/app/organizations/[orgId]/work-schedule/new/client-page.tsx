"use client";

import Link from "next/link";
import { CreateWorkSchedulePlaceForm } from "@/features/work-schedule/places/components/create-work-schedule-place-form";

export default function NewWorkScheduleClient({ orgId }: { orgId: string }) {
  return (
    <div className="p-8 w-full max-w-3xl mx-auto flex flex-col gap-8">
      {/* 🟢 ส่วน Layout: หัวข้อและปุ่มย้อนกลับ */}
      <div className="flex items-center gap-4 border-b pb-6">
        <Link
          href={`/organizations/${orgId}/work-schedule`}
          className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all"
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
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            สร้างสถานที่ทำงานใหม่
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            เพิ่มคลินิกสาขา แผนก หรือพื้นที่สำหรับการจัดตารางเวร
          </p>
        </div>
      </div>

      {/* 🟢 ส่วน Component: โยน orgId ให้ Form ไปจัดการลอจิกต่อ */}
      <CreateWorkSchedulePlaceForm orgId={orgId} />
    </div>
  );
}
