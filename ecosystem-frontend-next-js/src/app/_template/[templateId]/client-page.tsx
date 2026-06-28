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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios"; // ตรวจสอบว่าเป็น Error เป็นรูปแบบ Error จาก Axios หรือไม่

// 🌟 1. Import Queries ของ Feature นี้
// ปรับตามใช้งานจริง
import { organizationsQueries } from "@/features/organizations/hooks/organizations.queries";

// 🌟 2. Import Components ของ Feature (Folder ของ Feature)
// ปรับตามใช้งานจริง
import { CreateWorkSchedulePlaceForm } from "@/features/[template]/components/method-[template]-form";
// import { CreateTemplateModal } from "@/features/[template]/components/create-[template]-modal";

// Import Components ของ หน้า UI นี้ (Folder เดียวกัน)
// import TemplateLoading from "./loading";

// Import Components ของ หน้า UI ส่วนกลาง
import { DataStateWrapper } from "@/components/data-state-wrapper";

// 🌟 3. Import Error Codes และ Error Message
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { USER_ERROR_MESSAGES } from "@/constants/error-messages"; // ข้อความที่เตรียมไว้สำหรับ ErrorCode แต่ละประเภท

// ==========================================
// 🛡️ Component ดักจับ Error จาก URL
// ==========================================
// (💡 Tip: ในอนาคตสามารถแยกฟังก์ชันนี้ไปไว้ใน components/url-error-toast.tsx ได้)
function ToastNotifier() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (!errorCode) return; // ถ้าไม่มี error ใน URL ก็ไม่ต้องทำอะไรเลย

    // ปรับตามใช้งานจริง
    if (errorCode === "invalid_id") {
      // ปรับตามใช้งานจริง
      toast.error("รหัสองค์กรไม่ถูกต้อง");

      // ปรับตามใช้งานจริง
    } else if (
      // ปรับตามใช้งานจริง
      errorCode === ErrorCode.ORGANIZATION_NOT_FOUND ||
      errorCode === ErrorCode.ORGANIZATION_DELETED ||
      errorCode === ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION
    ) {
      // ปรับตามใช้งานจริง
      const errorMessage = USER_ERROR_MESSAGES[errorCode]; // ใช้ "ข้อความ" ที่เตรียมไว้ใน USER_ERROR_MESSAGES

      // ปรับตามใช้งานจริง
      toast.error("ไม่สามารถเข้าถึงข้อมูลได้", {
        description: errorMessage, // <--- จะได้ข้อความที่ต่างกันตาม Error เลยครับ!
      });
    }

    // ลบ ?error=invalid_id ออกจาก URL เพื่อไม่ให้ Toast เด้งซ้ำตอนกดรีเฟรชหน้า
    // ปรับตามใช้งานจริง
    window.history.replaceState(
      null,
      "",

      // ปรับตามใช้งานจริง
      "/organizations",
    );
  }, [searchParams]);

  return null; // ไม่ต้องแสดงผล UI อะไรออกมา
}

// ==========================================
// 🖥️ Component หลัก
// ==========================================
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
    isFetching,
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
  if (!isLoaded) {
    return (
      <div className="p-8 text-gray-500">กำลังโหลดข้อมูล... (!isLoaded)</div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 text-gray-500">กำลังโหลดข้อมูล... (isLoading)</div>
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
  // ปรับตามใช้งานจริง
  // const organizations = data?.organizations || [];

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
          {/* ============================ */}
          {/* 🟢 ส่วนหัวข้อ และปุ่มย้อนกลับ */}
          {/* ============================ */}
          <div className="flex items-center gap-4 border-b pb-6">
            {/* ============================ */}
            {/* 🟢 ปุ่มย้อนกลับ */}
            {/* ============================ */}
            <Link
              href={`/work-schedule/${templateId}/new`} // ปรับตามใช้งานจริง
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

            {/* ============================ */}
            {/* 🟢 ส่วนหัวข้อ */}
            {/* ============================ */}
            <div className="flex-1 flex items-center justify-between">
              <div>
                {/* หัวข้อ */}
                <h2 className="text-3xl font-bold text-gray-800">
                  ตั้งค่าองค์กร: {orgDetails?.name}
                </h2>
                {/* รายละเอียด */}
                <p className="text-gray-500 mt-1 font-mono text-sm">
                  Organization ID: {orgDetails?.id}
                </p>
                {/* สถานะการโหลด */}
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
                  จัดการประวัติคนไข้ ตารางนัดหมาย ทันตแพทย์
                  และระบบคลังสต๊อกวัสดุ
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
                    <p className="text-sm text-gray-500">
                      ระบบบริหารตารางการทำงาน
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-6 flex-1">
                  จัดการกะทำงาน สร้างแม่แบบเวร
                  และให้พนักงานกดจองคิวลงเวลาทำงานได้แบบยืดหยุ่น
                </p>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm font-medium text-gray-500">
                    สถานะ:{" "}
                    <span className="text-purple-600 font-bold">
                      พร้อมใช้งาน
                    </span>
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

          {/* 🟢 ส่วน Component: Form */}
          <CreateWorkSchedulePlaceForm orgId={templateId} />
        </div>
      </DataStateWrapper>
    </>
  );
}
