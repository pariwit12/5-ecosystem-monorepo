"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { workScheduleStaffQueries } from "@/features/work-schedule/staff/work-schedule-staff.queries";
import { DataStateWrapper } from "@/components/data-state-wrapper";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

// ==========================================
// 🖥️ Component หลัก
// ==========================================
// 🌟 รับ orgId ที่ผ่านการสแกนแล้วมาจาก Server Component
export default function WorkScheduleAdminStaffClient({
  placeId,
}: {
  placeId: string;
}) {
  const router = useRouter();

  // =================================
  // 🚀 1. ดึงข้อมูลจาก useQuery / Hook
  // =================================
  const { getToken, userId, isLoaded } = useAuth();
  const { data, isLoading, isFetching, error } = useQuery(
    workScheduleStaffQueries.listsByPlaceId(userId, getToken, placeId, [
      ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
    ]),
  );

  // ==========================================
  // 🌟 2. ด่านดักจับ Error แล้ว Redirect
  // ==========================================
  useEffect(() => {
    // เช็คว่ามี Error และเป็น Error จาก Axios (บอก TS ให้ยอมให้เราดึง .response ได้)
    if (error && isAxiosError(error)) {
      const errorCode = error.response?.data?.errorCode;

      // สร้างลิสต์ของ Error ที่เราต้องการเตะออก (ใช้ Enum ที่ import มาได้เลย)
      const accessDeniedErrors = [
        ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
        ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
      ];

      if (accessDeniedErrors.includes(errorCode)) {
        router.push(`/work-schedule?error=${errorCode}`);

        return;
      }

      if (error && data !== undefined) {
        toast.error(
          "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
        );
      }
    }
  }, [error, router, data]);

  // ===================
  // Loading / Error UI
  // ===================

  // ป้องกันหน้าจอกระพริบ (UI Flash):
  if (
    error &&
    isAxiosError(error) &&
    [
      ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
    ].includes(error.response?.data?.errorCode)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        เกิดข้อผิดพลาด กำลังพากลับไปยังหน้าแรกของ Work-Schedule...
      </div>
    );
  }

  // Error อื่นๆ ยังไม่ได้จัดการ ให้ global-error-modal แสดงผล แต่หน้าจอยังไม่ได้จัดการต่อ

  // ============================
  // 🎯 2. ฟังก์ชันจัดการเมื่อ "กดปุ่ม"
  // ============================

  // ปรับตามใช้งานจริง
  // eslint-disable-next-line
  const handleSelectOrganization = (orgId: string) => {
    // ปรับตามใช้งานจริง
    router.push(`/organizations/${orgId}/settings`);
  };

  // =========================================================
  // 3. จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // =========================================================
  // แกะเอา array organizations ออกมาจาก Response (ใส่ fallback เป็น [] กันแครช)
  const staffs = data?.workScheduleStaffs || [];

  // ==================
  // ส่วนแสดงผล UI หลัก
  // ==================
  return (
    <>
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
          {/* 🟢 ส่วนหัวข้อ และปุ่มย้อนกลับ */}
          <div className="flex items-center gap-4 border-b pb-6">
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

            <div className="flex-1 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  รายชื่อพนักงาน
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  จัดการข้อมูลพนักงานในระบบตารางงานของคุณ
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

          {/* 🟢 โซน Grid แสดงรายชื่อพนักงาน */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* 🌟 การ์ดสำหรับสร้างพนักงานใหม่ (Create Card) */}
            <Link
              href={`/work-schedule/admin/${placeId}/staff/new`}
              className="group flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer min-h-40"
            >
              <div className="w-12 h-12 bg-white text-gray-400 rounded-full flex items-center justify-center shadow-sm group-hover:text-purple-600 group-hover:scale-110 transition-transform mb-3">
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="font-medium text-gray-600 group-hover:text-purple-600">
                เพิ่มพนักงานใหม่
              </span>
            </Link>

            {/* 🌟 แสดงรายการพนักงานจากการ Map Data */}
            {staffs.map((staff) => (
              <div
                key={staff.id}
                className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="overflow-hidden">
                    <h4
                      className="text-lg font-bold text-gray-800 truncate"
                      title={staff.name}
                    >
                      {staff.name}
                    </h4>
                    <p
                      className="text-xs text-gray-400 font-mono truncate"
                      title={staff.id}
                    >
                      ID: {staff.id.substring(0, 8)}...
                    </p>
                  </div>
                </div>

                <div className="mt-auto border-t pt-4 flex justify-end">
                  <button
                    // onClick={() =>
                    //   router.push(
                    //     `/work-schedule/admin/${placeId}/staff/${staff.id}`,
                    //   )
                    // }
                    className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    ดูรายละเอียด &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DataStateWrapper>
    </>
  );
}
