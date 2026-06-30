// ------------------------------------------------------------------------
// Pattern: Server First Query (Hydration) + Client Fetching
// ------------------------------------------------------------------------

// Client Side Rendering                เหมาะกับ query ข้อมูลขนาดใหญ่
// Server Side Rendering (Hydration)    เหมาะกับ query ข้อมูลขนาดเล็ก
// Server Side Rendering (initialData)  เหมาะกับ มี DB สำหรับ GET แยกออกมาอีกตัว (สามารถใช้โควต้าได้อย่างสิ้นเปลือง แต่ UX จะเร็วและดีกว่า)

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios"; // ตรวจสอบว่าเป็น Error เป็นรูปแบบ Error จาก Axios หรือไม่

// ----------- Import Queries -----------
import {
  // ปรับตามใช้งานจริง
  templateQueries,

  // ปรับตามใช้งานจริง
} from "@/features/[template]/[template].queries";

// ----------- Import Loading -----------
import TemplateLoading from "./loading"; // ปรับตามใช้งานจริง

// ----------- Import Error -----------
import TemplateErrorQuery from "./error";

// ----------- Import Error Codes และ Error Message -----------
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { USER_ERROR_MESSAGES } from "@/constants/error-messages"; // ข้อความที่เตรียมไว้สำหรับ ErrorCode แต่ละประเภท

// ==========================================
// 🛡️ Component ดักจับ Error จาก URL
// ==========================================

function ToastNotifier() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get(
      // ปรับตามใช้งานจริง
      "error",
    );

    // ปรับตามใช้งานจริง
    if (!errorCode) return; // ถ้าไม่มี error ใน URL ก็ไม่ต้องทำอะไรเลย

    // ปรับตามใช้งานจริง
    if (errorCode === "invalid_id") {
      //
      // ปรับตามใช้งานจริง
      toast.error(
        //
        // ปรับตามใช้งานจริง
        "รหัสองค์กรไม่ถูกต้อง",
      );

      // ปรับตามใช้งานจริง
    } else if (
      //
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

    // ลบ ?error=... ออกจาก URL โดยคงพาทปัจจุบันไว้ (เพื่อไม่ให้ Toast เด้งซ้ำตอนกดรีเฟรชหน้า)
    window.history.replaceState(
      null,
      "",
      window.location.pathname, // URL ที่จะแทนที่
    );

    // วิธีการใช้งาน window.location

    // สมมติว่า URL เต็มๆ บนหน้าจอของผู้ใช้ตอนนี้คือ: https://www.yourdomain.com/template/123?error=invalid_id
    // window.location.origin   จะได้ค่าเป็น https://www.yourdomain.com (ส่วนโดเมนหลัก)
    // window.location.pathname จะได้ค่าเป็น /template/123 (ส่วนเส้นทางหน้าเว็บ) 👈 พระเอกของเราอยู่ตรงนี้ครับ!
    // window.location.search   จะได้ค่าเป็น ?error=invalid_id (ส่วน Query Parameters ทั้งหมด)
    // window.location.hash     จะได้ค่าเป็น #section1 (ถ้ามีการกระโดดไปตามจุดต่างๆ ของหน้า)
    //
  }, [searchParams]);

  return null; // ไม่ต้องแสดงผล UI อะไรออกมา
}

// ==========================================
// 🛡️ (จบ) Component ดักจับ Error จาก URL
// ==========================================

// ==========================================
// 🖥️ Component หลัก
// ==========================================

// ปรับตามใช้งานจริง
export default function TemplateClient({
  //
  // ปรับตามใช้งานจริง
  templateId,
  //
}: {
  //
  // ปรับตามใช้งานจริง
  templateId: string;
  //
}) {
  const router = useRouter();
  const { getToken, userId, isLoaded } = useAuth();

  // =================================
  // 🚀 ดึงข้อมูล Query
  // =================================
  const {
    //
    // ปรับตามใช้งานจริง
    data: dataQuery,
    isLoading,
    isFetching,
    error: errorQuery,
    refetch,
    //
  } = useQuery(
    //
    // ปรับตามใช้งานจริง
    templateQueries

      // ปรับตามใช้งานจริง
      .getTemplate(
        //
        // ปรับตามใช้งานจริง
        "string1",
        "string2",
        "string3",

        // ปรับตามใช้งานจริง
        userId,
        getToken,

        // ปรับตามใช้งานจริง
        [
          // ปรับตามใช้งานจริง
          ErrorCode.ORGANIZATION_NOT_FOUND,
          ErrorCode.ORGANIZATION_DELETED,
          ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
        ],
      ),
  );

  // =================================
  // 🚀 (จบ) ดึงข้อมูล Query
  // =================================

  // ===============================================
  // 🌟 ดักจับ Error (จาก Query) แล้ว Redirect
  // ===============================================

  useEffect(() => {
    // เช็คว่า 1. มี Error และ 2. เป็น Error จาก Axios (บอก TS ให้ยอมให้เราดึง .response ได้)
    if (errorQuery && isAxiosError(errorQuery)) {
      // ปรับตามใช้งานจริง (จาก Backend)
      const errorCode = errorQuery.response?.data?.errorCode;

      // สร้างลิสต์ของ Error ที่เราต้องการเตะออก (ใช้ Enum ที่ import มาได้เลย)

      const accessDeniedErrors = [
        //
        // ปรับตามใช้งานจริง
        ErrorCode.ORGANIZATION_NOT_FOUND,
        ErrorCode.ORGANIZATION_DELETED,
        ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
      ];

      if (accessDeniedErrors.includes(errorCode)) {
        //
        // ปรับตามใช้งานจริง
        router.push(
          //
          // ปรับตามใช้งานจริง
          `/template?error=${errorCode}`,
        );

        return;
      }
    }

    // =================================================
    // Error จากการ fetching ที่ผ่านตรวจสอบ redirect แล้ว
    // =================================================

    if (errorQuery && dataQuery !== undefined) {
      toast.error(
        "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
      );
    }
    //
  }, [errorQuery, router, dataQuery]);

  // ===============================================
  // 🌟 (จบ) ดักจับ Error (จาก Query) แล้ว Redirect
  // ===============================================

  // ==================================================================================================
  // Flash UI (สำหรับ Redirect) (จำเป็นกรณี Client มี First Query  หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ==================================================================================================

  // ป้องกันหน้าจอกระพริบ (UI Flash)
  // ทำงานเฉพาะตอนโหลดหน้าจอ เนื่องจากใช้ if() = ถ้าเกิด error จาก fetching จะไม่กระพริบ
  if (
    errorQuery &&
    isAxiosError(errorQuery) &&
    [
      // ปรับตามใช้งานจริง
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
      //
    ].includes(errorQuery.response?.data?.errorCode) &&
    dataQuery === undefined
  ) {
    return <TemplateLoading />;
  }

  // ==================================================================================================
  // (จบ) Flash UI (สำหรับ Redirect) (จำเป็นกรณี Client มี First Query  หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ==================================================================================================

  // =================================================================================
  // Loading UI (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // =================================================================================

  // isLoaded คือ จาก useAuth (Clerk) ป้องกันจังหวะแรกที่ยังโหลด userId ไม่เสร็จ

  if (!isLoaded || isLoading) {
    return <TemplateLoading />;
  }

  // =================================================================================
  // (จบ) Loading UI (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // =================================================================================

  // ===========================================================================================================
  // Early Return: หน้าจอ Error โหลดครั้งแรก (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ===========================================================================================================

  if (errorQuery && dataQuery === undefined) {
    return <TemplateErrorQuery reset={() => refetch()} />;
  }

  // ===========================================================================================================
  // (จบ) Early Return: หน้าจอ Error โหลดครั้งแรก (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ===========================================================================================================

  // ============================
  // 🎯 ฟังก์ชันเฉพาะของหน้า
  // ============================

  // ============================
  // 🎯 (จบ) ฟังก์ชันเฉพาะของหน้า
  // ============================

  // ==============================================================
  // จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // ==============================================================

  // ปรับตามใช้งานจริง
  // const organizations = data?.organizations || [];

  // ==============================================================
  // (จบ) จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // ==============================================================

  // ==================
  // ส่วนแสดงผล UI หลัก
  // ==================

  return (
    <>
      {/* ===================================== */}
      {/* Toast สำหรับ Error ที่มาพร้อมกับ URL */}
      {/* ===================================== */}

      <Suspense
        // Suspense คือ การบอกว่าข้างในนี้อาจจะโหลดช้ากว่าส่วนอื่น ให้ไปรันโค้ดส่วนอื่นก่อนได้เลย
        // เช่น ต้องดึงข้อมูลจาก URL เป็นต้น
        //
        fallback={null}
        // fallback คือ ระหว่างโหลด ให้แสดงอะไรรอ
        // ถ้าโค้ดข้างใน ไม่ได้ return UI อะไร ให้ใส่ {null}
        // ถ้าโค้ดข้างใน มี return UI ให้ใส่ {skeleton} ของ โค้ดนั้น
      >
        <ToastNotifier />
      </Suspense>

      {/* ========================================================================================== */}
      {/* Main UI (children) */}
      {/* ========================================================================================== */}

      <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
        {/*  */}
        {/* =================================================================== */}
        {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มแก้ไขข้อมูล (ขวาสุด) */}
        {/* =================================================================== */}

        <div className="flex items-center gap-4 border-b pb-6">
          {/*  */}
          {/* ========================== */}
          {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด) */}
          {/* ========================== */}

          <Link
            href={
              //
              `/template/${templateId}/server-query` // ปรับตามใช้งานจริง
              //
            }
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

          {/* ========================== */}
          {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด) */}
          {/* ========================== */}

          {/* ============================================ */}
          {/* 🟢 ส่วนหัวข้อ (ซ้าย) และ ปุ่มแก้ไขข้อมูล (ขวา) */}
          {/* ============================================ */}

          <div className="flex-1 flex items-center justify-between">
            {/*  */}
            {/* ============================= */}
            {/* 🟢 กลุ่มของส่วนหัวข้อ (ซ้าย) */}
            {/* ============================= */}

            <div>
              {/*  */}
              <h2 // หัวข้อ
                className="text-3xl font-bold text-gray-800"
              >
                --------ชื่อหัวข้อ--------
              </h2>

              <p // รายละเอียด (ใต้หัวข้อ) เช่น ชื่อองค์กรที่สังกัด
                className="text-gray-500 mt-1 font-mono text-sm"
              >
                --------รายละเอียด--------
              </p>

              {/* ================================= */}
              {/* สถานะ isFetching + Skeleton */}
              {/* ================================= */}

              {isFetching && (
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
                  {/*  */}
                  {/* ปรับตามใช้งานจริง */}
                  กำลังอัปเดตข้อมูล...
                  {/*  */}
                </span>
              )}
              {!isFetching && (
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

              {/* ================================= */}
              {/* (จบ) สถานะ isFetching + Skeleton */}
              {/* ================================= */}
              {/*  */}
            </div>

            {/* ============================= */}
            {/* 🟢 (จบ) กลุ่มของส่วนหัวข้อ (ซ้าย) */}
            {/* ============================= */}

            {/* ============================== */}
            {/* 🌟 ปุ่มลิ้งไปแก้ไขข้อมูล (ขวา) */}
            {/* ============================== */}

            <Link
              href={
                //
                `/template/${templateId}/server-query` // ปรับตามใช้งานจริง
                //
              }
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              {/*  */}
              {/* ปรับตามใช้งานจริง */}
              แก้ไขข้อมูลทั่วไป
              {/*  */}
            </Link>

            {/* ============================== */}
            {/* 🌟 (จบ) ปุ่มลิ้งไปแก้ไขข้อมูล (ขวา) */}
            {/* ============================== */}
            {/*  */}
          </div>

          {/* ============================================ */}
          {/* 🟢 (จบ) ส่วนหัวข้อ (ซ้าย) และ ปุ่มแก้ไขข้อมูล (ขวา) */}
          {/* ============================================ */}
          {/*  */}
        </div>

        {/* =================================================================== */}
        {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มแก้ไขข้อมูล (ขวาสุด) */}
        {/* =================================================================== */}

        {/* ============================ */}
        {/* 🌟 เนื้อหาหลักตรงนี้ */}
        {/* ============================ */}

        {/* ============================ */}
        {/* 🌟 (จบ) เนื้อหาหลักตรงนี้ */}
        {/* ============================ */}
        {/*  */}
      </div>

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
    </>
  );
}
