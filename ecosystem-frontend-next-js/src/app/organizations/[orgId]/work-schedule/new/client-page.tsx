"use client";

import Link from "next/link";
import { CreateWorkSchedulePlaceForm } from "@/features/work-schedule/places/components/create-work-schedule-place-form";

export default function NewWorkScheduleClient({ orgId }: { orgId: string }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-3xl mx-auto flex flex-col gap-8">
      {/* 🟢 ส่วน Layout: หัวข้อและปุ่มย้อนกลับ */}
      <div className="flex flex-wrap items-start gap-3 border-b pb-6 sm:items-center sm:gap-4">
        <Link
          href={`/organizations/${orgId}/work-schedule`}
          className="min-h-11 min-w-11 p-2 bg-muted text-muted-foreground rounded-full hover:bg-muted transition-all"
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
          <h2 className="break-words text-2xl font-bold text-foreground sm:text-3xl">
            สร้างสถานที่ทำงานใหม่
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            เพิ่มคลินิกสาขา แผนก หรือพื้นที่สำหรับการจัดตารางเวร
          </p>
        </div>
      </div>

      {/* 🟢 ส่วน Component: โยน orgId ให้ Form ไปจัดการลอจิกต่อ */}
      <CreateWorkSchedulePlaceForm orgId={orgId} />
    </div>
  );
}
