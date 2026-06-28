"use client";

import Link from "next/link";

// ==========================================
// 🖥️ Component หลัก
// ==========================================
// 🌟 รับ orgId ที่ผ่านการสแกนแล้วมาจาก Server Component
export default function WorkScheduleAdminClient({
  placeId,
}: {
  placeId: string;
}) {
  // ==================
  // ส่วนแสดงผล UI หลัก
  // ==================
  return (
    <>
      {/* =============================== */}
      {/* Loading / Error UI (By Wrapper) */}
      {/* =============================== */}
      {/* <DataStateWrapper
        isAuthLoaded={isLoaded}
        isQueryLoading={isLoading}
        errorQuery={error}
      > */}
      {/* ================== */}
      {/* Main UI (children) */}
      {/* ================== */}
      <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
        {/* 🟢 STREAMING_CHUNK:Rendering the header and back button */}
        <div className="flex items-center gap-4 border-b pb-6">
          <Link
            href={`/work-schedule`}
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
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-800">
                แผงควบคุมผู้ดูแล
              </h2>
              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                Admin Mode
              </span>
            </div>
            <p className="text-gray-500 mt-1 text-sm">
              จัดการตารางเวลาและบุคลากรในสถานที่ทำงานนี้
            </p>
            {/* <p className="text-xs text-gray-400 font-mono mt-1">Place ID: {placeId}</p> */}
          </div>
        </div>

        {/* 🟢 STREAMING_CHUNK:Rendering the main menu cards */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            เลือกเมนูที่ต้องการจัดการ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ========================================== */}
            {/* 🌟 เมนูที่ 1: จัดการตารางเวร (Manage Schedule) */}
            {/* ========================================== */}
            <Link
              href={`/work-schedule/admin/${placeId}/position`}
              className="group relative flex flex-col bg-white border-2 border-transparent hover:border-purple-300 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* แถบสีตกแต่งด้านบน */}
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 group-hover:h-2 transition-all duration-300"></div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                    จัดการตารางเวร
                  </h4>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    สร้างกะการทำงาน (Slots), อนุมัติการจองเวร,
                    และตรวจสอบตารางเวลาของพนักงานทั้งหมดในสถานที่นี้
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center text-purple-600 font-medium text-sm group-hover:translate-x-2 transition-transform">
                เปิดตำแหน่งงานและตารางเวร
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </Link>

            {/* ========================================== */}
            {/* 👥 เมนูที่ 2: จัดการพนักงาน (Manage Staff) */}
            {/* ========================================== */}
            <Link
              href={`/work-schedule/admin/${placeId}/staff`}
              className="group relative flex flex-col bg-white border-2 border-transparent hover:border-blue-300 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* แถบสีตกแต่งด้านบน */}
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 group-hover:h-2 transition-all duration-300"></div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                    จัดการพนักงาน
                  </h4>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    เพิ่ม/ลบรายชื่อพนักงาน, จัดการตำแหน่ง (Positions)
                    และตั้งค่าสิทธิ์การเข้าถึงของบุคลากร
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-2 transition-transform">
                เปิดรายชื่อพนักงาน
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
      {/* </DataStateWrapper> */}
    </>
  );
}
