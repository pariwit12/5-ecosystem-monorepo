"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { workScheduleLogInQueries } from "@/features/work-schedule/log-in/work-schedule-log-in.queries";
import { DataStateWrapper } from "@/components/data-state-wrapper";

// ==========================================
// 🛡️ Component ดักจับ Error จาก URL
// ==========================================
// (💡 Tip: ในอนาคตสามารถแยกฟังก์ชันนี้ไปไว้ใน components/url-error-toast.tsx ได้)
function ToastNotifier() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (!errorCode) return; // ถ้าไม่มี error ใน URL ก็ไม่ต้องทำอะไรเลย

    if (errorCode === "invalid_id") {
      toast.error("รหัสองค์กรไม่ถูกต้อง");

      //   // ปรับตามใช้งานจริง
      // } else if (
      //   // ปรับตามใช้งานจริง
      //   errorCode === ErrorCode.ORGANIZATION_NOT_FOUND ||
      //   errorCode === ErrorCode.ORGANIZATION_DELETED ||
      //   errorCode === ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION
      // ) {
      //   // ปรับตามใช้งานจริง
      //   const errorMessage = USER_ERROR_MESSAGES[errorCode]; // ใช้ "ข้อความ" ที่เตรียมไว้ใน USER_ERROR_MESSAGES

      //   // ปรับตามใช้งานจริง
      //   toast.error("ไม่สามารถเข้าถึงข้อมูลองค์กรได้", {
      //     description: errorMessage, // <--- จะได้ข้อความที่ต่างกันตาม Error เลยครับ!
      //   });
    }

    // ลบ ?error=invalid_id ออกจาก URL เพื่อไม่ให้ Toast เด้งซ้ำตอนกดรีเฟรชหน้า
    window.history.replaceState(null, "", "/work-schedule");
  }, [searchParams]);

  return null; // ไม่ต้องแสดงผล UI อะไรออกมา
}

// ==========================================
// 🖥️ Component หลัก
// ==========================================
export default function TemplatePage() {
  // =================================
  // 🚀 1. ดึงข้อมูลจาก useQuery / Hook
  // =================================
  const { getToken, userId, isLoaded } = useAuth();

  const { data, isLoading, isFetching, error } = useQuery(
    // ปรับตามใช้งานจริง
    workScheduleLogInQueries.userRolesByClerkId(userId, getToken, []),
  );

  // ============================
  // 🎯 2. ฟังก์ชันจัดการเมื่อ "กดปุ่ม"
  // ============================

  // =========================================================
  // 3. จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // =========================================================
  // แกะเอา array organizations ออกมาจาก Response (ใส่ fallback เป็น [] กันแครช)
  const placesAsAdmin = data?.placesAsAdmin || [];
  const placesAsStaff = data?.placesAsStaff || [];

  // ==================
  // ส่วนแสดงผล UI หลัก
  // ==================
  return (
    <>
      {/* ใส่ fallback={null} เพื่อบอกว่าระหว่างรอโหลด ไม่ต้องโชว์อะไร */}
      <Suspense fallback={null}>
        {/* 💡 เกร็ดความรู้เพิ่มเติม: การที่เราเอา <Suspense> มาครอบไว้แบบนี้ เป็นการบอก Next.js
            ว่า "ตรงส่วนนี้มีการใช้งานข้อมูลที่ต้องรอดึงจากเบราว์เซอร์ (URL) นะ ยูสามารถข้ามไปประมวลผล (Build) หน้าจอส่วนอื่นๆ ก่อนได้เลย ไม่ต้องรอ!"
            ซึ่งจะช่วยให้ระบบ Static Rendering ของ Next.js ทำงานได้เต็มประสิทธิภาพ และผ่านฉลุยตอนสั่ง pnpm run build ครับ */}
        <ToastNotifier />
      </Suspense>

      {/* =============================== */}
      {/* Loading / Error UI (By Wrapper) */}
      {/* =============================== */}
      <DataStateWrapper
        isAuthLoaded={isLoaded}
        isQueryLoading={isLoading}
        errorQuery={error}
      >
        {/* ================== */}
        {/* Main UI (children) */}
        {/* ================== */}

        <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
          {/* 🟢 ส่วนหัวข้อและปุ่มย้อนกลับ */}
          <div className="flex items-center gap-4 border-b pb-6">
            <Link
              href={`/`}
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
            <div className="flex-1 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  ระบบจัดการสถานที่และตารางเวลา
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Workforce Scheduling System
                </p>
                {isFetching && !isLoading && (
                  <span className="text-sm text-gray-400 flex items-center gap-2 mt-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    กำลังอัปเดตข้อมูล...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 🟢 ถ้ายังไม่มีสถานที่ทำงานเลยซักที่ */}
          {placesAsAdmin.length === 0 && placesAsStaff.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl mb-4">
                📍
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                ยังไม่มีสถานที่ทำงานในระบบ
              </h3>
              <p className="text-gray-500 max-w-md mb-6 text-sm leading-relaxed">
                {`เริ่มต้นจัดการตารางเวลาด้วยการสร้าง "สถานที่ทำงาน (Workplace)"
                เช่น แผนกผู้ป่วยนอก, คลินิกสาขา, หรือพื้นที่ที่ต้องการจัดเวร`}
              </p>
            </div>
          ) : (
            <div
              className={`flex flex-col gap-10 transition-opacity duration-200 ${isFetching && !isLoading ? "opacity-60" : "opacity-100"}`}
            >
              {/* 👑 Section 1: Places you manage (Admin) */}
              {placesAsAdmin.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>👑</span> สถานที่ที่คุณดูแล (Places you manage)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {placesAsAdmin.map((place) => (
                      <div
                        key={place.id}
                        className="border border-purple-200 bg-white rounded-2xl p-6 shadow-sm flex flex-col hover:border-purple-400 transition-all hover:shadow-md relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-bl-xl">
                          Admin
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1 mt-2">
                          {place.name}
                        </h4>
                        <div className="mt-auto pt-4 border-t flex gap-2">
                          <Link
                            href={`/work-schedule/admin/${place.id}`}
                            className="flex-1 text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm shadow-sm"
                          >
                            จัดการตารางเวร
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🩺 Section 2: Your Workplaces (Staff) */}
              {placesAsStaff.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>🩺</span> สถานที่ทำงานของคุณ (Your Workplaces)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {placesAsStaff.map((place) => (
                      <div
                        key={place.id}
                        className="border border-blue-200 bg-white rounded-2xl p-6 shadow-sm flex flex-col hover:border-blue-400 transition-all hover:shadow-md relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-bl-xl">
                          Staff
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 mb-1 mt-2">
                          {place.name}
                        </h4>
                        <div className="mt-auto pt-4 border-t flex gap-2">
                          <Link
                            // ปรับตามใช้งานจริง
                            href={`/`}
                            className="flex-1 text-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors text-sm"
                          >
                            ดูตารางของฉัน
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DataStateWrapper>
    </>
  );
}
