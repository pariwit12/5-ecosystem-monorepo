// -----------------------------------------------------------
// Pattern A: Client-Only Page (page.tsx เป็น "use client" เลย)
// -----------------------------------------------------------

// เหมาะสำหรับ: หน้า Dashboard หรือหน้ารวมลิสต์ข้อมูล (List Page) ที่
// - ไม่ต้องทำ SEO
// - ไม่ได้มี Parameter ใน URL ให้ต้องตรวจสอบความถูกต้องก่อน

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { isAxiosError } from "axios"; // ตรวจสอบว่าเป็น Error เป็นรูปแบบ Error จาก Axios หรือไม่

// 🌟 1. Import Queries ของ Feature นี้
import { templateQueries } from "@/features/[template]/[template].queries";

// 🌟 2. Import Components ของ Feature (Folder ของ Feature)
// import { CreateTemplateModal } from "@/features/[template]/components/create-[template]-modal";
import { CreateOrgModal } from "@/features/organizations/components/create-organization-modal";

// Import Components ของ หน้า UI นี้ (Folder เดียวกัน)
// eslint-disable-next-line
import TemplateLoading from "./loading";

// Import Components ของ หน้า UI ส่วนกลาง
import { DataStateWrapper } from "@/components/data-state-wrapper";

// 🌟 3. Import Error Codes และ Error Message
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum"; // ErrorCode ที่สร้างขึ้นใน Backend
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
      toast.error("ไม่สามารถเข้าถึงข้อมูลองค์กรได้", {
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
export default function TemplatePage() {
  const router = useRouter();

  // =================================
  // 🚀 1. ดึงข้อมูลจาก useQuery / Hook
  // =================================
  const { getToken, userId, isLoaded } = useAuth();

  const {
    // ปรับตามใช้งานจริง
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery(
    // ปรับตามใช้งานจริง
    templateQueries.detailByClerkId(userId, getToken, "1", "2", "3", [
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
  const handleSelectOrganization = (orgId: string) => {
    // ปรับตามใช้งานจริง
    router.push(`/organizations/${orgId}/settings`);
  };

  // =========================================================
  // 3. จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // =========================================================
  // แกะเอา array organizations ออกมาจาก Response (ใส่ fallback เป็น [] กันแครช)
  // ปรับตามใช้งานจริง
  const organizations = data?.organizations || [];

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
        <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8 relative">
          {/* ========== ส่วนหัวข้อ ========== */}
          <div className="w-full">
            <h2 className="text-3xl font-bold text-gray-800">องค์กรของคุณ</h2>
            <p className="text-gray-500 mt-2">
              จัดการและเลือกองค์กรที่คุณสังกัด หรือสร้างองค์กรใหม่
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

          {/* ========== ส่วนแสดงผล ========== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ========== ส่วนแสดงผลหลัก ========== */}
            {organizations.map((org) => (
              <div
                key={org.id}
                className="p-6 border rounded-2xl shadow-sm bg-white hover:shadow-md transition-all flex flex-col items-start"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 font-bold text-xl">
                  {/* เอาตัวอักษรตัวแรกของชื่อมาทำเป็นโลโก้จำลอง */}
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-gray-800">{org.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  ID:{" "}
                  <span className="font-mono text-xs">
                    {org.id.slice(0, 8)}...
                  </span>
                </p>

                {/* 🌟 ปุ่มกดเลือกองค์กร เปลี่ยนสีตามสถานะ */}
                <button
                  onClick={() => handleSelectOrganization(org.id)}
                  className="mt-auto px-4 py-2 font-medium rounded-lg w-full transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  ตั้งค่าองค์กร
                </button>
              </div>
            ))}

            {/* ส่วนแสดงผลปุ่มเปิด Modal */}
            {/* 🌟 ใช้งาน Modal สร้างองค์กร (ปุ่มจะต่อท้ายลิสต์พอดี) */}
            <CreateOrgModal />
          </div>
        </div>
      </DataStateWrapper>
    </>
  );
}
