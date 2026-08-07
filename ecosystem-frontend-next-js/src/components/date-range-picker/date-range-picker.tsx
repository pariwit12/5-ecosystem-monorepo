"use client";

import { DateTime } from "luxon";
import { cn } from "@/lib/utils";

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string; // เผื่อต้องการปรับ margin/padding จากภายนอก
}) {
  // ฟังก์ชันลัดสำหรับตั้งค่า 7 วัน
  const handleSet7Days = () => {
    onStartDateChange(DateTime.now().toFormat("yyyy-MM-dd"));
    onEndDateChange(DateTime.now().plus({ days: 6 }).toFormat("yyyy-MM-dd"));
  };

  // ฟังก์ชันลัดสำหรับตั้งค่าเดือนนี้
  const handleSetThisMonth = () => {
    const now = DateTime.now();
    onStartDateChange(now.startOf("month").toFormat("yyyy-MM-dd"));
    onEndDateChange(now.endOf("month").toFormat("yyyy-MM-dd"));
  };

  return (
    <div
      className={cn(
        "flex",
        "flex-wrap",
        "items-end ", // ชิดล่าง (แกนรอง)

        "gap-4",
        "p-4",

        "bg-white",
        "border",
        "border-gray-200",
        "rounded-xl",

        "shadow-sm",
        className,
      )}
    >
      {/* ================================ */}
      {/* 🟢 ส่วนเลือกวันที่ เริ่มต้น - สิ้นสุด */}
      {/* ================================ */}

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="start-date"
            className="text-sm font-bold text-gray-700"
          >
            เริ่มวันที่
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="end-date" className="text-sm font-bold text-gray-700">
            ถึงวันที่
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ================================ */}
      {/* (จบ) 🟢 ส่วนเลือกวันที่ เริ่มต้น - สิ้นสุด */}
      {/* ================================ */}

      {/* =========================== */}
      {/* 🟢 โซน ปุ่มลัด (Presets) */}
      {/* =========================== */}

      <div
        className={cn(
          "flex",

          "gap-2",

          // "sm:ml-auto",
        )}
      >
        <button
          onClick={handleSet7Days}
          type="button" // ป้องกันฟอร์ม submit ถ้าไปอยู่ใน <form>
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
        >
          7 วัน
        </button>
        <button
          onClick={handleSetThisMonth}
          type="button"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
        >
          เดือนนี้ (1 เดือน)
        </button>
      </div>

      {/* =========================== */}
      {/* (จบ) 🟢 โซน ปุ่มลัด (Presets) */}
      {/* =========================== */}
      {/*  */}
    </div>
  );
}
