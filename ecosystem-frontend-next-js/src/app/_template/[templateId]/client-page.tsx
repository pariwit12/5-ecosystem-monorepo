// ------------------------------------------------------------------------
// Pattern B: Server Validator + Client Render (page.tsx + client-page.tsx)
// ------------------------------------------------------------------------

// เหมาะสำหรับ: หน้าที่มี Dynamic Route เช่น /[id]/edit หรือ /[id]/dashboard ที่
// - ต้องการใช้พลังของ Server Component ในการตรวจสอบรูปแบบ UUID (Zod) หรือเช็คสิทธิ์เบื้องต้น
// - ถ้าผิดก็ดักเตะออก (Redirect) ตั้งแต่ฝั่งเซิร์ฟเวอร์ หน้าจอก็จะไม่กระพริบครับ

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAxiosError } from "axios"; // ตรวจสอบว่าเป็น Error เป็นรูปแบบ Error จาก Axios หรือไม่

// 🌟 1. Import Queries ของ Feature นี้
import { organizationsQueries } from "@/features/organizations/hooks/organizations.queries";

// 🌟 2. Import Components ของ Feature (Folder ของ Feature)
// import { CreateTemplateModal } from "@/features/[template]/components/create-[template]-modal";

// Import Components ของ หน้า UI นี้ (Folder เดียวกัน)
// import TemplateLoading from "./loading";

// Import Components ของ หน้า UI ส่วนกลาง
// ...

// 🌟 3. Import Error Codes และ Error Message
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

// 🌟 รับ orgId ที่ผ่านการสแกนแล้วมาจาก Server Component
export default function TemplateClient({ templateId }: { templateId: string }) {
  const router = useRouter();

  // =================================
  // 🚀 1. ดึงข้อมูลจาก useQuery / Hook
  // =================================
  const { getToken, userId, isLoaded } = useAuth();
  const {
    data: orgDetails,
    isLoading,
    error,
  } = useQuery(
    organizationsQueries.detail(userId, templateId, getToken, [
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
    ]),
  );

  // ==========================================
  // 🌟 2. ด่านดักจับ Error แล้ว Redirect
  // ==========================================
  useEffect(() => {
    // เช็คว่ามี Error และเป็น Error จาก Axios (บอก TS ให้ยอมให้เราดึง .response ได้)
    if (error && isAxiosError(error)) {
      // ปรับตามใช้งานจริง (จาก Backend)
      const errorCode = error.response?.data?.errorCode;

      // สร้างลิสต์ของ Error ที่เราต้องการเตะออก (ใช้ Enum ที่ import มาได้เลย)
      // ปรับตามใช้งานจริง
      const accessDeniedErrors = [
        ErrorCode.ORGANIZATION_NOT_FOUND,
        ErrorCode.ORGANIZATION_DELETED,
        ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
      ];

      if (accessDeniedErrors.includes(errorCode)) {
        // ปรับตามใช้งานจริง
        router.push(`/organizations?error=${errorCode}`);
      }
    }
  }, [error, router]);

  // ===================
  // Loading / Error UI
  // ===================
  // isLoaded คือ จาก useAuth (Clerk) ป้องกันจังหวะแรกที่ยังโหลด userId ไม่เสร็จ
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // ป้องกันหน้าจอกระพริบ (UI Flash):
  if (
    error &&
    isAxiosError(error) &&
    [
      // ปรับตามใช้งานจริง
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
    ].includes(error.response?.data?.errorCode)
  ) {
    return (
      // ปรับตามใช้งานจริง
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        {/* ปรับตามใช้งานจริง */}
        เกิดข้อผิดพลาด กำลังพากลับไปยังหน้ารายชื่อองค์กร...
      </div>
    );
  }

  // Error อื่นๆ ยังไม่ได้จัดการ ให้ global-error-modal แสดงผล แต่หน้าจอยังไม่ได้จัดการต่อ

  // ==================
  // ส่วนแสดงผล UI หลัก
  // ==================
  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
      {/* 🟢 ส่วนหัวข้อ และปุ่มย้อนกลับ */}
      <div className="flex items-center gap-4 border-b pb-6">
        <Link
          href="/organizations"
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
              ตั้งค่าองค์กร: {orgDetails?.name}
            </h2>
            <p className="text-gray-500 mt-1 font-mono text-sm">
              Organization ID: {orgDetails?.id}
            </p>
          </div>

          {/* 🌟 ปุ่มลิงก์ไปหน้า General Settings */}
          <Link
            href={`/organizations/${templateId}/settings/general`}
            className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            แก้ไขข้อมูลทั่วไป
          </Link>
        </div>
      </div>

      {/* 🟢 โซนจัดการโมดูล (Subscriptions) */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          โมดูลและแอปพลิเคชัน (Subscriptions)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* การ์ดแอป Toothcraft */}
          <div className="border border-blue-100 bg-white rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
              แนะนำ
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl">
                🦷
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">
                  Dental Clinic Information System
                </h4>
                <p className="text-sm text-gray-500">
                  ระบบบริหารจัดการคลินิกทันตกรรม
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6 flex-1">
              จัดการประวัติคนไข้ ตารางนัดหมาย ทันตแพทย์ และระบบคลังสต๊อกวัสดุ
            </p>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm font-medium text-gray-500">
                สถานะ:{" "}
                <span className="text-blue-600 font-bold">พร้อมใช้งาน</span>
              </span>
              <Link
                href={`/organizations/${templateId}/dental-clinic`}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-medium rounded-lg transition-colors text-sm shadow-sm"
              >
                เข้าสู่ระบบจัดการคลินิก
              </Link>
            </div>
          </div>

          {/* 🌟 การ์ดแอป Work Schedule (ใหม่) */}
          <div className="border border-purple-100 bg-white rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden transition-all hover:border-purple-300 hover:shadow-md">
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
              ใหม่
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold text-2xl">
                🗓️
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">
                  Work Schedule System
                </h4>
                <p className="text-sm text-gray-500">ระบบบริหารตารางการทำงาน</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6 flex-1">
              จัดการกะทำงาน สร้างแม่แบบเวร
              และให้พนักงานกดจองคิวลงเวลาทำงานได้แบบยืดหยุ่น
            </p>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm font-medium text-gray-500">
                สถานะ:{" "}
                <span className="text-purple-600 font-bold">พร้อมใช้งาน</span>
              </span>
              <Link
                href={`/organizations/${templateId}/work-schedule`}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white font-medium rounded-lg transition-colors text-sm shadow-sm"
              >
                เข้าสู่ระบบจัดเวร
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
