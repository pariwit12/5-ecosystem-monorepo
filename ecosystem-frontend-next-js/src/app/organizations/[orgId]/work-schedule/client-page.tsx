"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { workSchedulePlacesQueries } from "@/features/work-schedule/places/hooks/work-schedule-places.queries";

import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAxiosError } from "axios";

import { DataStateWrapper } from "@/components/data-state-wrapper";

export default function WorkScheduleListClient({ orgId }: { orgId: string }) {
  const { getToken, userId, isLoaded } = useAuth();

  const { data, isLoading, isFetching, error } = useQuery(
    workSchedulePlacesQueries.listByOrganizationId(userId, orgId, getToken, [
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
    ]),
  );

  // ดึง array ออกมาใช้ (ถ้ายังไม่มีข้อมูลให้ใช้ array ว่างไปก่อน)
  const workSchedulePlaces = data?.workSchedulePlaces || [];

  const router = useRouter();

  // 🌟 ดักจับ Error และสั่งเตะออก (Redirect)
  useEffect(() => {
    // เช็คว่ามี Error และเป็น Error จาก Axios (บอก TS ให้ยอมให้เราดึง .response ได้)
    if (error && isAxiosError(error)) {
      const errorCode = error.response?.data?.errorCode;

      // สร้างลิสต์ของ Error ที่เราต้องการเตะออก (ใช้ Enum ที่ import มาได้เลย)
      const accessDeniedErrors = [
        ErrorCode.ORGANIZATION_NOT_FOUND,
        ErrorCode.ORGANIZATION_DELETED,
        ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
      ];

      if (accessDeniedErrors.includes(errorCode)) {
        router.push(`/organizations?error=${errorCode}`);
      }
    }
  }, [error, router]);

  // 🌟 กันหน้าจอกระพริบระหว่างเตะออก
  if (
    error &&
    isAxiosError(error) &&
    [
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
    ].includes(error.response?.data?.errorCode)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        เกิดข้อผิดพลาด กำลังพากลับไปยังหน้ารายชื่อองค์กร...
      </div>
    );
  }

  // Error อื่นๆ ยังไม่ได้จัดการ ให้ global-error-modal แสดงผล แต่หน้าจอยังไม่ได้จัดการต่อ
  // if (error) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen text-red-500">
  //       เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
  //     </div>
  //   );
  // }

  return (
    <DataStateWrapper
      isAuthLoaded={isLoaded}
      isQueryLoading={isLoading}
      errorQuery={error}
    >
      {/* 🌟 3. This is your pure UI. It will ONLY render if Auth and Data are 100% ready! */}

      <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
        {/* 🟢 ส่วนหัวข้อและปุ่มย้อนกลับ */}
        <div className="flex items-center gap-4 border-b pb-6">
          <Link
            href={`/organizations/${orgId}/settings`}
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
              {/* 🌟 THE UX MAGIC: A subtle indicator that only shows during background fetches */}
              {isFetching && !isLoading && (
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" /* spinner svg */ />
                  กำลังอัปเดตข้อมูล...
                </span>
              )}
            </div>
            <Link
              href={`/organizations/${orgId}/work-schedule/new`}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm"
            >
              + สร้างสถานที่ทำงานใหม่
            </Link>
          </div>
        </div>

        {/* 🟢 ส่วนแสดงรายชื่อสถานที่ทำงาน */}
        {workSchedulePlaces.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl mb-4">
              📍
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              ยังไม่มีสถานที่ทำงานในระบบ
            </h3>
            <p className="text-gray-500 max-w-md mb-6 text-sm leading-relaxed">
              {`เริ่มต้นจัดการตารางเวลาด้วยการสร้าง "สถานที่ทำงาน (Workplace)" เช่น
            แผนกผู้ป่วยนอก, คลินิกสาขา, หรือพื้นที่ที่ต้องการจัดเวร`}
            </p>
            <Link
              href={`/organizations/${orgId}/work-schedule/new`}
              className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all text-sm shadow-md"
            >
              สร้างสถานที่ทำงานแห่งแรก
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workSchedulePlaces.map((place) => (
              <div
                key={place.id}
                className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm flex flex-col hover:border-gray-300 transition-all"
              >
                <h4 className="text-lg font-bold text-gray-800 mb-1">
                  {place.name}
                </h4>
                {/* <p className="text-xs text-gray-400 font-mono mb-4">
                Timezone: {place.timezone}
              </p> */}
                <div className="mt-auto pt-4 border-t flex gap-2">
                  <Link
                    href={`/organizations/${orgId}/work-schedule/${place.id}/dashboard`}
                    className="flex-1 text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                  >
                    จัดการตาราง
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DataStateWrapper>
  );
}
