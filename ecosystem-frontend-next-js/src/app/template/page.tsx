// -----------------------------------------------------------
// UI Template
// -----------------------------------------------------------

"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { USER_ERROR_MESSAGES } from "@/constants/error-messages";

// ----------- Import Form -----------
import {
  // ปรับตามใช้งานจริง
  MethodTemplateForm,

  // ปรับตามใช้งานจริง
} from "@/features/[template]/components/method-[template]-form";

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

// ===========================================
// ⏱️ ส่วนทดสอบ Loading: หน่วงเวลา 5 วินาที
// ===========================================

await new Promise((resolve) => setTimeout(resolve, 5000));

// ===========================================
// ⏱️ (จบ) ส่วนทดสอบ Loading: หน่วงเวลา 5 วินาที
// ===========================================

// ==========================================
// 🖥️ Component หลัก
// ==========================================

export default function TemplatePage() {
  //

  // แปลงเวลาไว้แสดงเวลา Update ล่าสุด
  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const refetch = () => {
    return;
  };

  const isFetching = false;
  const errorQuery = undefined;
  const dataUpdatedAt = 123;

  const templateData: { id: string; name: string }[] = [
    {
      id: "UUID1",
      name: "test1-123456789-123456789-123456789-123456789-123456789",
    },
    { id: "UUID2", name: "test2" },
    { id: "UUID3", name: "test3" },
    { id: "UUID4", name: "test4" },
    // {
    //   id: "UUID5",
    //   name: "test5-123456789-123456789-123456789-123456789-123456789",
    // },
  ];
  const templateId = "123";

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

      <div
        className={cn(
          //
          "@container",
          // @container: ให้ component นี้เป็น ref ของ cqw เช่น 1cqw คือ 1% ของขนาดของ component นี้

          "w-full", // w-full: ให้กว้าง 100% ของพื้นที่ที่มันอยู่

          "max-w-7xl",

          // max-w- (Max Width): ล็อคความกว้างสูงสุด (วัดด้วยหน่วย rem)

          // โดยอิงจากขนาดตัวอักษรตั้งต้นของเบราว์เซอร์ ซึ่งปกติ 1 rem จะเท่ากับ 16px

          // 7xl = 80rem = 1280px (7xl = Standard)
          // 6xl = 72rem = 1152px

          "mx-auto", // จัดกึ่งกลางหน้าจอ
          // mx-auto: เมื่อเราล็อคความกว้างด้วย max-w แล้ว คลาสนี้จะช่วยจัดให้กล่องอยู่ "กึ่งกลางหน้าจอ" อัตโนมัติครับ

          "flex",
          "flex-col", // เราใช้ flex และ flex-col เพื่อจะใช้ gap ช่วยจัดหน้า (ซึ่งง่ายกว่าการเขียน mt มากๆ)
          "gap-2 sm:gap-3", // จัดเรียงบนลงล่าง ห่างกัน 8
          // flex flex-col gap-6: บังคับให้ลูกๆ ภายใน (Header กับ Content) เรียงต่อกันจากบนลงล่าง และมีช่องว่าง (gap-6) ห่างกันเสมอ โดยที่เราไม่ต้องไปนั่งเขียน margin-top ให้ลูกแต่ละตัวครับ

          "relative", // เตรียมไว้สำหรับ absolute child
          // เช่น absolute top-0 right-0 (ตัวลูกจะวัดระยะจาก component relative นี้)

          // "p-8",

          // "px-4 sm:px-6 lg:px-8", // ระยะขอบ ซ้าย-ขวา
          // // px-4 sm:px-6 lg:px-8: นี่คือศาสตร์ของ Responsive Padding ครับ
          // // จอมือถือ: ขอบซ้ายขวาเล็กๆ (px-4) เพื่อไม่ให้เสียพื้นที่เนื้อหา
          // // จอแท็บเล็ต (sm:): ขอบใหญ่ขึ้นมาหน่อย (px-6)
          // // จอคอมพิวเตอร์ (lg:): ขอบกว้างสวยงาม (px-8)

          // ใน Tailwind CSS จะใช้ระบบที่เรียกว่า Breakpoints (จุดหักเหของขนาดหน้าจอ)

          // เพื่อให้เห็นภาพรวม นี่คือขนาดหน้าจอมาตรฐานของ Tailwind เรียงจากเล็กไปใหญ่ครับ:

          // (ไม่มีตัวย่อ): มือถือ (เล็กกว่า 640px)
          // sm: (Small): มือถือแนวนอน / แท็บเล็ตขนาดเล็ก (ตั้งแต่ 640px ขึ้นไป)
          // md: (Medium): แท็บเล็ต (ตั้งแต่ 768px ขึ้นไป)
          // lg: (Large): แล็ปท็อป (ตั้งแต่ 1024px ขึ้นไป)
          // xl: (Extra Large): หน้าจอเดสก์ท็อป (ตั้งแต่ 1280px ขึ้นไป)
          // 2xl: : หน้าจอขนาดใหญ่พิเศษ (ตั้งแต่ 1536px ขึ้นไป)

          "px-4 sm:px-6",

          // "py-4 sm:py-6 lg:py-8", // ระยะขอบ บน-ล่าง
          "py-4 sm:py-6",

          //
        )}
      >
        {/*  */}
        {/* ============================== */}
        {/* ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

        <div>
          {/*  */}
          {/* =================================================================== */}
          {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มสร้างข้อมูล (ขวาสุด) */}
          {/* =================================================================== */}

          <div
            className={cn(
              //
              "flex", // display: flex
              "flex-wrap", // ขึ้นบรรทัดใหม่หากล้นขอบ
              "items-center", // จัด component ให้อยู่ตรงกลาง ในแนว vertical
              "justify-between", // ดีด component (ซ้าย - กลาง - ขวา)

              // items-center (Cross Axis): จะทำหน้าที่จัดกึ่งกลางในแนวขวาง
              // ซึ่งในกรณีของ flex-col มันคือการจัดกึ่งกลาง แนวนอน (Horizontal / ซ้าย-ขวา) ครับ
              // (นี่คือเหตุผลที่ไอคอนและตัวหนังสือของคุณมาอยู่ตรงกลางการ์ดซ้าย-ขวาพอดี)

              // justify-center (Main Axis): จะทำหน้าที่จัดกึ่งกลางในแนวหลัก
              // ซึ่งในกรณีของ flex-col มันคือการจัดกึ่งกลาง แนวตั้ง (Vertical / บน-ล่าง) ครับ!

              "gap-2 sm:gap-3", // ระยะระหว่าง component (ซ้าย-ขวา และ บน-ล่าง (หากเกิดการ flex-wrap))

              "border-b",
              // "pt-2 sm:pt-3", // ระยะขอบ ด้านบน (ไปต่อกับ padding ของ div ใหญ่อีกที)
              "pb-4 sm:pb-4", // ระยะขอบ ด้านล่าง
            )}
          >
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
              className={cn(
                //
                "p-2", // p-2 (Padding): เว้นระยะพื้นที่ว่าง "ด้านใน" กล่องรอบทิศทาง (บน ล่าง ซ้าย ขวา) ขนาด 8px (0.5rem)
                // เพื่อให้ตัวไอคอนลูกศรไม่เบียดขอบเขตของปุ่มจนเกินไป

                "rounded-full", // rounded-full (Border Radius): ปรับมุมขอบให้โค้งมนแบบ 100% (รูปทรงแคปซูล)
                // แต่เนื่องจากปุ่มนี้มีไอคอนที่มีสัดส่วนความกว้าง-ยาวเท่ากัน (จัตุรัส) และมี p-2 ล้อมรอบเท่ากัน
                // คลาสนี้เลยเนรมิตให้ปุ่มกลายเป็น "วงกลม" ที่สมบูรณ์แบบครับ

                "text-gray-600 bg-gray-100 hover:bg-gray-200 transition",
              )}
            >
              <svg
                className={cn(
                  //
                  "h-6 w-6",
                )}
                xmlns="http://www.w3.org/2000/svg"
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
            {/* 🟢 ส่วนหัวข้อ */}
            {/* ============================================ */}

            <div
              className={cn(
                //
                "flex-1", // ขยายเต็มพื้นที่ (แบ่งกันกับตัวอื่นที่มี flex-1 หรือ flex-auto)

                "min-w-0", // min-w-0 เพื่อเปิดทางให้กล่องลูกสามารถ "ตัดคำ" ได้

                "gap-4 sm:gap-6", // ระยะระหว่าง component (ซ้าย-ขวา และ บน-ล่าง)
              )}
            >
              {/*  */}
              {/* ============================= */}
              {/* 🟢 กลุ่มของส่วนหัวข้อ (ซ้าย) */}
              {/* ============================= */}
              {/*  */}
              <h2 // หัวข้อ
                className={cn(
                  //
                  "text-2xl sm:text-3xl", // ขนาด font

                  "truncate", // ตัดคำเป็น ... ถ้ายาวเกิน

                  "font-bold text-gray-800",
                )}
              >
                {/* สร้างตำแหน่งงานใหม่ */}
                รายการตำแหน่งงาน
              </h2>

              <p // รายละเอียด (ใต้หัวข้อ) เช่น ชื่อองค์กรที่สังกัด
                className={cn(
                  //
                  "text-xs sm:text-sm", // ขนาด font

                  "truncate", // ตัดคำเป็น ... ถ้ายาวเกิน

                  "font-mono text-gray-500",
                )}
              >
                กรอกรายละเอียดและบันทึกเพื่อดำเนินการต่อ
                {/* จัดการและตรวจสอบข้อมูลรายการทั้งหมดในระบบ */}
              </p>
              {/*  */}

              {/* ============================= */}
              {/* 🟢 (จบ) ส่วนหัวข้อ */}
              {/* ============================= */}
              {/*  */}
            </div>

            {/* ======================== */}
            {/* Create Button (ขวา) */}
            {/* ======================== */}

            <Link
              href={
                //
                `/template/${templateId}/server-query` // ปรับตามใช้งานจริง
                //
              }
              className={cn(
                //

                // ทำให้ปุ่มหน้าตาเป็นปุ่ม
                "p-2 sm:px-4 sm:py-2",
                "rounded-full sm:rounded-xl",

                "text-white",
                "bg-blue-500",
                "hover:bg-blue-700",
                "active:bg-blue-800",
                "shadow-sm",
                "transition-colors",
              )}
            >
              <svg
                className={cn(
                  //
                  "h-6 w-6",

                  "sm:hidden",
                )}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>

              <span
                className={cn(
                  //
                  "hidden sm:block",

                  "text-xs sm:text-sm", // ขนาด font

                  "truncate", // ตัดคำเป็น ... ถ้ายาวเกิน

                  "font-medium",
                )}
              >
                {/* 
                  -------- ปรับตามใช้งานจริง --------
                */}
                + สร้างข้อมูลใหม่ / สร้าง...ใหม่
                {/* 
                  --------------------------------
                */}
              </span>
            </Link>

            {/* ======================== */}
            {/* (จบ) Create Button (ขวา) */}
            {/* ======================== */}
            {/*  */}
          </div>

          {/* =================================================================== */}
          {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มสร้างข้อมูล (ขวาสุด) */}
          {/* =================================================================== */}

          {/* ====================== */}
          {/* 🌟 แถบสถานะข้อมูล */}
          {/* ====================== */}

          <div
            className={cn(
              //
              "flex",
              "flex-wrap",
              "items-center",
              "justify-end", // ดีด component ให้ชิดขวา

              "h-6", // fix ขนาด เพื่อให้หน้าจอไม่กระตุกเวลาเปลี่ยนสถานะ

              "text-xs",
            )}
          >
            {
              // =================================
              // UI Fetching - กำลังอัปเดตข้อมูล
              // =================================

              isFetching ? (
                <span
                  className={cn(
                    //
                    "flex", // display: flex
                    "flex-wrap",
                    "items-center", // จัด component ให้อยู่ตรงกลาง ในแนว vertical

                    "gap-2", // ระยะระหว่าง component

                    "text-gray-500 animate-pulse",
                  )}
                >
                  <svg
                    className={cn(
                      //
                      "h-3.5 w-3.5", // fix ขนาดของโลโก้

                      "animate-spin text-blue-500",
                    )}
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  กำลังอัปเดตข้อมูล...
                </span>
              ) : //

              // =================================
              // (จบ) UI Fetching - กำลังอัปเดตข้อมูล
              // =================================

              // ======================
              // UI Error Fetched
              // ======================

              errorQuery ? (
                <div
                  className={cn(
                    //
                    "flex",
                    "flex-wrap",
                    "items-center",

                    "gap-2",
                  )}
                >
                  <span
                    className={cn(
                      //
                      "flex",
                      "flex-wrap",
                      "items-center",

                      "gap-1.5",

                      "font-medium text-red-500",
                    )}
                  >
                    <svg
                      className={cn(
                        //
                        "h-3.5 w-3.5", // fix ขนาดของโลโก้
                      )}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    อัปเดตล่าสุดไม่สำเร็จ
                  </span>

                  <button
                    type="button"
                    onClick={
                      () =>
                        //
                        refetch() // ปรับตามใช้งานจริง
                      //
                    }
                    className={cn(
                      //
                      "font-semibold underline",
                      "text-blue-600 hover:text-blue-700 transition-colors",
                      "cursor-pointer",
                    )}
                  >
                    ลองใหม่
                  </button>
                </div>
              ) : (
                //
                // ======================
                // (จบ) UI Error Fetched
                // ======================

                // ======================
                // UI Fetch Success
                // ======================

                dataUpdatedAt > 0 && (
                  <div
                    className={cn(
                      //
                      "flex",
                      "flex-wrap",
                      "items-center",

                      "gap-3",
                    )}
                  >
                    <span
                      className={cn(
                        //
                        "flex",
                        "flex-wrap",
                        "items-center",

                        "gap-1.5",

                        "text-gray-400",
                      )}
                    >
                      <svg
                        className={cn(
                          //
                          "h-3.5 w-3.5", // fix ขนาดของโลโก้

                          "text-green-500",
                        )}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      อัปเดตล่าสุดเมื่อ: {formatLastUpdate(dataUpdatedAt)}
                    </span>

                    {/* ปุ่มรีเฟรชข้อมูลแบบแมนนวล */}
                    <button
                      type="button"
                      onClick={
                        () =>
                          //
                          refetch() // ปรับตามใช้งานจริง
                        //
                      }
                      className={cn(
                        //
                        "flex",
                        "flex-wrap",
                        "items-center",

                        "gap-1",

                        "font-medium text-gray-400 hover:text-gray-600 cursor-pointer transition-colors",
                      )}
                      title="กดเพื่ออัปเดตข้อมูลใหม่"
                    >
                      <svg
                        className={cn(
                          //
                          "h-3.5 w-3.5", // fix ขนาดของโลโก้
                        )}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17"
                        />
                      </svg>
                      รีเฟรช
                    </button>
                  </div>
                )

                // ======================
                // (จบ) UI Fetch Success
                // ======================
                //
              )
            }
          </div>

          {/* ====================== */}
          {/* 🌟 (จบ) แถบสถานะข้อมูล */}
          {/* ====================== */}
          {/*  */}
        </div>

        {/* ============================== */}
        {/* (จบ) ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

        {/* ==================================== */}
        {/* 🌟 โซนเมนูการทำงาน (การ์ด - Grid) */}
        {/* ==================================== */}

        <div
          className={cn(
            //
            "flex",
            "flex-col", // เราใช้ flex และ flex-col เพื่อจะใช้ gap ช่วยจัดหน้า (ซึ่งง่ายกว่าการเขียน mt มากๆ)

            "gap-2 sm:gap-3",
          )}
        >
          <h3
            className={cn(
              //
              "text-lg",

              "font-bold text-gray-800",
            )}
          >
            เมนูการจัดการ
          </h3>

          <div
            className={cn(
              //
              "grid",
              // "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
              "grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))]",

              "gap-2 sm:gap-3",
            )}
          >
            {/* ================== */}
            {/* เมนู: สีมาตรฐาน */}
            {/* ================== */}

            <Link
              href={
                //
                `/template/${templateId}/target` // ปรับตามใช้งานจริง
                //
              }
              className={cn(
                //
                "group",

                "flex",
                "flex-col",

                "items-center",
                "text-center",

                "px-4",
                "py-6",

                "relative",

                "overflow-hidden",

                "border",
                "rounded-2xl",

                "bg-white",
                "border-gray-200",

                "cursor-pointer",

                "transition-all",
                "hover:bg-gray-50",
                "hover:border-gray-300",
                "hover:shadow-md",
              )}
            >
              <div
                className={cn(
                  //
                  "w-12 h-12",
                  "rounded-xl",

                  "flex",
                  "items-center",
                  "justify-center",

                  "bg-gray-100",
                  "text-gray-600",

                  "transition-all",
                  "group-hover:bg-white",
                  "group-hover:shadow-sm",

                  "shrink-0",

                  "mb-4",
                )}
              >
                <svg
                  className={cn(
                    //
                    "h-6 w-6",
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h4
                className={cn(
                  //
                  "text-lg",

                  "font-bold",

                  "text-gray-800",
                )}
              >
                แก้ไขรายละเอียด
              </h4>
              <p
                className={cn(
                  //
                  "text-sm",

                  "text-gray-500",

                  "mt-1",
                )}
              >
                ปรับปรุงข้อมูลทั่วไปของรายการนี้
              </p>
            </Link>

            {/* ================== */}
            {/* (จบ) เมนู: สีมาตรฐาน */}
            {/* ================== */}

            {/* ==================================== */}
            {/* เมนู: สีหลัก (เน้น หรือ ใช้งานบ่อยสุด) */}
            {/* ==================================== */}

            <Link
              href={
                //
                `/template/${templateId}/target` // ปรับตามใช้งานจริง
                //
              }
              className={cn(
                //
                "group",
                // group: นี่คือคลาสหัวหน้าแก๊งครับ!
                // มันเป็นการประกาศให้ Tailwind รู้ว่า "ถ้ามีเมาส์มาวางทาบ (Hover) ที่กล่องแม่ตัวนี้
                // ให้ส่งสัญญาณไปบอกกล่องลูกๆ ข้างในด้วยนะ"
                // (สังเกตว่าด้านในจะมีไอคอนหรือข้อความที่ใช้คลาส group-hover:... รอรับคำสั่งเปลี่ยนสี หรือขยายขนาดอยู่ครับ)

                "flex",
                "flex-col",

                "items-center",
                "text-center",

                "px-4",
                "py-6",

                "relative",
                // เป็นการปักหมุดบอกตำแหน่งว่า "ถ้ามีกล่องลูกตัวไหนใช้ absolute ให้มาอิงพิกัดจากมุมของการ์ดใบนี้นะ"
                // (ใช้เผื่อกรณีคุณอยากเอา Badge เล็กๆ ไปแปะมุมขวาบนของการ์ด)

                "overflow-hidden", // overflow-hidden: แปลตรงตัวคือ "อะไรที่ล้นทะลุขอบออกไป ให้ตัดทิ้ง (ซ่อน) ไปเลย"
                // คลาสนี้มักใส่คู่กับกล่องที่มีขอบโค้งมนครับ เพื่อป้องกันไม่ให้พื้นหลังของกล่องลูก ทะลุขอบโค้งๆ ของกล่องแม่ออกมาเป็นมุมเหลี่ยม

                "border-2",
                "rounded-2xl", // ทำมุมของกล่องให้โค้งมนระดับ 2 Extra Large (16px) ให้ความรู้สึกเป็นมิตรและทันสมัย

                "bg-blue-50/50",
                "border-blue-100",

                "cursor-pointer",

                "transition-all", // transition-all: เป็นสารหล่อลื่น ที่ทำให้ลูกเล่น Hover ทั้งหมด (ขอบเปลี่ยนสี, พื้นหลังสว่างขึ้น, เงาเด้งขึ้น)
                // ไม่เกิดขึ้นแบบกระตุก แต่จะค่อยๆ "เฟดเปลี่ยนสเตตัสอย่างนุ่มนวล" ครับ
                "hover:bg-blue-50",
                "hover:border-blue-300",
                "hover:shadow-md", // hover:shadow-md: พอเอาเมาส์ชี้ ให้สร้างเงาขนาดกลาง (Medium Shadow) ด้านล่างกล่อง
                // ทำให้การ์ดดูลอยเด้งขึ้นมาชนนิ้ว
              )}
            >
              <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform shrink-0">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4
                className={cn(
                  //
                  "text-lg",

                  "font-bold",

                  "text-gray-900",
                  "group-hover:text-blue-700",
                  "transition-colors",
                )}
              >
                ดูตารางคิว
              </h4>
              <p
                className={cn(
                  //
                  "text-sm",

                  "text-gray-500",

                  "mt-1",
                )}
              >
                จัดการและตรวจสอบคิวงานของรายการนี้ data
                การบอกว่าข้างในนี้อาจจะโหลดช้ากว่าส่วนอื่น
                ทำงานเฉพาะตอนโหลดหน้าจอ
                {/* 123456789123456789123456789-123456789 -123456 -123 -123 -456 */}
              </p>
            </Link>

            {/* ==================================== */}
            {/* (จบ) เมนู: สีหลัก (เน้น หรือ ใช้งานบ่อยสุด) */}
            {/* ==================================== */}

            {/* ========================= */}
            {/* เมนูมาตรฐาน: รายละเอียด */}
            {/* ========================= */}

            <Link
              href={
                //
                `/template/${templateId}/target` // ปรับตามใช้งานจริง
                //
              }
              className={cn(
                //
                "group",

                "flex",
                "flex-col",

                "items-center",
                "text-center",

                "px-4",
                "py-6",

                "relative",

                "overflow-hidden",

                "border",
                "rounded-2xl",

                "bg-white",
                "border-gray-200",

                "cursor-pointer",

                "transition-all",
                "hover:bg-gray-50",
                "hover:border-gray-300",
                "hover:shadow-md",
              )}
            >
              <div
                className={cn(
                  //
                  "w-12 h-12",
                  "rounded-xl",

                  "flex",
                  "items-center",
                  "justify-center",

                  "bg-gray-100",
                  "text-gray-600",

                  "transition-all",
                  "group-hover:bg-white",
                  "group-hover:shadow-sm",

                  "shrink-0",

                  "mb-4",
                )}
              >
                <svg
                  className={cn(
                    //
                    "h-6 w-6",
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <h4
                className={cn(
                  //
                  "text-lg",

                  "font-bold",

                  "text-gray-800",
                )}
              >
                แก้ไขรายละเอียด
              </h4>
              <p
                className={cn(
                  //
                  "text-sm",

                  "text-gray-500",

                  "mt-1",
                )}
              >
                ปรับปรุงข้อมูลทั่วไปของรายการนี้
              </p>
            </Link>

            {/* ========================= */}
            {/* (จบ) เมนูมาตรฐาน: รายละเอียด */}
            {/* ========================= */}

            {/* ===================== */}
            {/* เมนูมาตรฐาน: ตั้งค่า */}
            {/* ===================== */}

            <Link
              href={
                //
                `/template/${templateId}/target` // ปรับตามใช้งานจริง
                //
              }
              className={cn(
                //
                "group",

                "flex",
                "flex-col",

                "items-center",
                "text-center",

                "px-4",
                "py-6",

                "relative",

                "overflow-hidden",

                "border",
                "rounded-2xl",

                "bg-white",
                "border-gray-200",

                "cursor-pointer",

                "transition-all",
                "hover:bg-gray-50",
                "hover:border-gray-300",
                "hover:shadow-md",
              )}
            >
              <div
                className={cn(
                  //
                  "w-12 h-12",
                  "rounded-xl",

                  "flex",
                  "items-center",
                  "justify-center",

                  "bg-gray-100",
                  "text-gray-600",

                  "transition-all",
                  "group-hover:bg-white",
                  "group-hover:shadow-sm",

                  "shrink-0",

                  "mb-4",
                )}
              >
                <svg
                  className={cn(
                    //
                    "h-6 w-6",
                  )}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h4
                className={cn(
                  //
                  "text-lg",

                  "font-bold",

                  "text-gray-800",
                )}
              >
                ตั้งค่าขั้นสูง
              </h4>
              <p
                className={cn(
                  //
                  "text-sm",

                  "text-gray-500",

                  "mt-1",
                )}
              >
                จัดการสิทธิ์และการตั้งค่าอื่นๆ
              </p>
            </Link>

            {/* ===================== */}
            {/* (จบ) เมนูมาตรฐาน: ตั้งค่า */}
            {/* ===================== */}
            {/*  */}
          </div>
        </div>

        {/* ==================================== */}
        {/* 🌟 (จบ) โซนเมนูการทำงาน (การ์ด - Grid) */}
        {/* ==================================== */}

        {/* 💡 สร้างพื้นที่ว่างคั่นกลาง (ดัน Danger Zone ให้ลงไปอยู่ล่างๆ) */}
        <div
          className={cn(
            //
            "mt-6 sm:mt-9",

            "border-t",
            "border-gray-100",
          )}
        />

        {/* ================================================= */}
        {/* 🚨 พื้นที่อันตราย (Danger Zone): ลบรายการ / ข้อมูล */}
        {/* ================================================= */}

        <div
          className={cn(
            //
            "flex",
            "flex-col",

            "gap-2 sm:gap-3",
          )}
        >
          <h3
            className={cn(
              //
              "text-lg",

              "font-bold text-red-600",

              "flex",
              "items-center",

              "gap-2",
            )}
          >
            <svg
              className={cn(
                //
                "h-5 w-5",
              )}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            เมนูสำหรับลบรายการ
          </h3>

          <div
            className={cn(
              //
              "border",
              "border-red-200",
              "bg-red-50",
              "rounded-2xl",

              "p-4",

              "flex",
              "flex-col sm:flex-row",
              "items-start sm:items-center",
              "justify-between",

              "gap-4",
            )}
          >
            <div
              className={cn(
                //
                "flex-1",
              )}
            >
              <h4
                className={cn(
                  //
                  "text-base font-bold text-gray-900",
                )}
              >
                ลบรายการนี้ออกจากระบบ
              </h4>
              <p
                className={cn(
                  //
                  "text-sm text-gray-600 mt-1",
                )}
              >
                เมื่อลบแล้ว
                ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้
                กรุณาตรวจสอบให้แน่ใจ
              </p>
            </div>

            {/* ================= */}
            {/* ปุ่ม ลบรายการนี้ */}
            {/* ================= */}

            <Link
              href={
                //
                `/template/${templateId}/delete-confirm` // Redirect ไปหน้ายืนยันการลบ
                //
              }
              className={cn(
                //
                "w-full sm:w-auto",

                "flex",
                "items-center",
                "justify-center",

                "rounded-xl",
                "px-5 py-2.5",
                "shrink-0",

                "font-medium",
                "text-white",
                "bg-red-600",
                "hover:bg-red-700",
                "active:bg-red-800",
                "shadow-sm transition-colors",
              )}
            >
              <svg
                className={cn(
                  //
                  "h-4 w-4",

                  "mr-2",
                )}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              ลบรายการนี้
            </Link>

            {/* ================= */}
            {/* (จบ) ปุ่ม ลบรายการนี้ */}
            {/* ================= */}
            {/*  */}
          </div>
        </div>

        {/* ================================================= */}
        {/* (จบ) 🚨 พื้นที่อันตราย (Danger Zone): ลบรายการ / ข้อมูล */}
        {/* ================================================= */}

        {/* ========================================================= */}
        {/* ส่วนแสดงผล: Stacked List (สำหรับข้อมูลที่มี Column ไม่เยอะ) */}
        {/* ========================================================= */}

        <div className="w-full border border-gray-200 rounded-xl shadow-sm bg-white divide-y divide-gray-100">
          {
            //
            templateData // ปรับตามใช้งานจริง
              //
              .map(
                (
                  //
                  temp, // ปรับตามใช้งานจริง
                  //
                ) => (
                  <div
                    key={
                      //
                      temp.id // ปรับตามใช้งานจริง
                      //
                    }
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4 hover:bg-gray-50/50 transition-colors"
                  >
                    {/*  */}
                    {/* ================= */}
                    {/* ฝั่งซ้าย: ข้อมูล */}
                    {/* ================= */}

                    <div className="flex items-center gap-4">
                      {/*  */}
                      {/* ================ */}
                      {/* โลโก้แบบกลม */}
                      {/* ================ */}

                      <div className="w-10 h-10 shrink-0 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {
                          //
                          temp.name // ปรับตามใช้งานจริง
                            //
                            .charAt(0)
                            .toUpperCase()
                        }
                      </div>

                      {/* ================ */}
                      {/* (จบ) โลโก้แบบกลม */}
                      {/* ================ */}

                      {/* ========================== */}
                      {/* รายละเอียด (ถัดจากโลโก้) */}
                      {/* ========================== */}

                      <div>
                        {/*  */}
                        {/* ====================== */}
                        {/* 🌟 ชื่อเต็มของรายการ */}
                        {/* ====================== */}

                        <h3 className="text-base font-semibold text-gray-800">
                          {
                            //
                            temp.name // ปรับตามใช้งานจริง
                            //
                          }
                        </h3>

                        {/* ====================== */}
                        {/* 🌟 (จบ) ชื่อเต็มของรายการ */}
                        {/* ====================== */}

                        {/* ================= */}
                        {/* 🌟 รายละเอียด */}
                        {/* ================= */}

                        <p className="text-sm text-gray-500 font-mono mt-0.5">
                          {/* 
                            -------- ปรับตามใช้งานจริง --------
                          */}
                          ID: {temp.id.slice(0, 8)}...
                          {/* 
                            --------------------------------
                          */}
                        </p>

                        {/* ================= */}
                        {/* 🌟 (จบ) รายละเอียด */}
                        {/* ================= */}
                        {/*  */}
                      </div>

                      {/* ========================== */}
                      {/* (จบ) รายละเอียด (ถัดจากโลโก้) */}
                      {/* ========================== */}
                      {/*  */}
                    </div>

                    {/* ================= */}
                    {/* (จบ) ฝั่งซ้าย: ข้อมูล */}
                    {/* ================= */}

                    {/* ================== */}
                    {/* ฝั่งขวา: Action */}
                    {/* ================== */}

                    <Link
                      href={
                        //
                        `/template/${temp.id}/server-query` // ปรับตามใช้งานจริง
                        //
                      }
                      className="w-full sm:w-auto px-6 py-2 text-center font-medium rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      เลือก
                    </Link>

                    {/* ================== */}
                    {/* (จบ) ฝั่งขวา: Action */}
                    {/* ================== */}
                    {/*  */}
                  </div>
                ),
              )
          }

          {/* ============================== */}
          {/* กรณีไม่มีข้อมูล (Empty State) */}
          {/* ============================== */}

          {
            //
            templateData.length === 0 && ( // ปรับตามใช้งานจริง
              //
              <div className="py-12 text-center text-gray-500">ไม่พบข้อมูล</div>
            )
          }

          {/* ============================== */}
          {/* (จบ) กรณีไม่มีข้อมูล (Empty State) */}
          {/* ============================== */}
          {/*  */}
        </div>

        {/* ========================================================= */}
        {/* (จบ) ส่วนแสดงผล: Stacked List (สำหรับข้อมูลที่มี Column ไม่เยอะ) */}
        {/* ========================================================= */}

        {/* ===================== */}
        {/* ส่วนแสดงผล: การ์ด */}
        {/* ===================== */}

        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> */}
        {/* <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6"> */}
        {/* <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6"> */}
        {/* <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5 2xl:gap-6"> */}
        <div
          className={cn(
            //
            "grid", // display: grid
            "grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))]",

            "gap-2 sm:gap-3",
            // ชุดคำสั่งนี้คือการสร้าง Layout แบบตาราง (Grid) ที่ปรับเปลี่ยนตามขนาดหน้าจอ (Responsive) โดยมีความหมายทีละตัวดังนี้ครับ:

            // grid: เปิดใช้งานระบบ Grid Layout (display: grid)

            // grid-cols-1: กำหนดให้ตารางนี้มี 1 คอลัมน์
            // md:grid-cols-2: เมื่อหน้าจอมีขนาดตั้งแต่ขนาดกลาง (md) ขึ้นไป ให้เปลี่ยนตารางนี้เป็น 2 คอลัมน์

            // grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))]: แปลว่าให้โปรแกรมจัดเองว่าจะแบ่งกี่ช่อง + ขนาดเท่าไหร่
            // auto-fill แปลว่า ถึงจะมีข้อมูลไม่ครบ ก็ให้ขนาดตามที่ควรจะเป็น
            // auto-fit แปลว่า ถ้าไม่มีข้อมูล โปรแกรมจะรวมช่องกลายเป็นช่องใหญ่ให้

            // minmax(x, 1fr): ให้ขนาดของการ์ด เล็กสุดคือ x, 1fr แปลว่าใช้พื้นที่เต็ม (ในแนวกว้าง)
            // minmax(250px, 1fr):
            // 250px (ความกว้างขั้นต่ำ): ถ้าย่อหน้าจอจนคอลัมน์แคบกว่า 250px มันจะปัดไอเทมตกไปอยู่บรรทัดใหม่ทันที
            // 1fr (ความกว้างสูงสุด): fr ย่อมาจาก fraction (สัดส่วน) หมายความว่า "ให้ใช้พื้นที่ที่เหลืออยู่ให้เต็ม" ถ้ามีพื้นที่เหลือ มันจะขยายขนาดคอลัมน์ให้กว้างขึ้นจนเต็มพื้นที่โดยอัตโนมัติ
            // min(100%,17rem) ใส่เพื่อให้เวลาหน้าจอเล็กกว่า 17rem แล้ว การ์ดไม่ทะลุไปด้านขวา

            // gap-6: กำหนดช่องว่าง (ระยะห่าง) ระหว่างไอเทมในตารางทั้งแนวตั้งและแนวนอน ขนาดเท่ากับ 1.5rem หรือ 24px

            // ฟังก์ชัน clamp(ค่าต่ำสุด, ค่าที่ต้องการให้ยืดหยุ่น, ค่าสูงสุด) จะรับค่า 3 ตัวครับ:
            // ค่าต่ำสุด (1rem หรือ 16px): บนจอมือถือ ช่องไฟจะไม่เล็กไปกว่านี้แล้ว
            // ค่าที่ต้องการให้ยืดหยุ่น (2vw): ตัวเลขนี้แหละคือพระเอก vw (Viewport Width) คือเปอร์เซ็นต์ความกว้างของหน้าจอ (2vw = 2% ของความกว้างจอ) พอหน้าจอขยายกว้างขึ้น ค่านี้จะใหญ่ขึ้นตาม ทำให้ช่องไฟค่อยๆ ถ่างออกอย่างนุ่มนวล
            // ค่าสูงสุด (2rem หรือ 32px): บนจอคอมพิวเตอร์ใหญ่ๆ ช่องไฟจะไม่กว้างไปกว่านี้แล้ว (ป้องกันไม่ให้การ์ดห่างกันจนดูขาดความเชื่อมโยง)

            // วิธีให้ระบบวัดจาก "ขนาดของ Component" แทนหน้าจอ
            // เพื่อให้แก้ปัญหาเรื่อง Sidebar เราจะเลิกใช้ vw แล้วเปลี่ยนไปใช้หน่วยที่ชื่อว่า cqw (Container Query Width) แทนครับ
            // vw = 1% ของหน้าจอเบราว์เซอร์
            // cqw = 1% ของ กล่องครอบ (Container) ที่มันอยู่
            //
          )}
        >
          {/*  */}
          {/* ======================================== */}
          {/* 🌟 ปุ่มสร้างข้อมูลใหม่ในรูปแบบ Ghost Card */}
          {/* ======================================== */}

          <Link
            href={
              //
              `/template/${templateId}/server-query` // ปรับตามใช้งานจริง
              //
            }
            className="p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all flex flex-col items-center justify-center text-gray-500 group min-h-50"
          >
            <div className="w-12 h-12 rounded-full bg-white border shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
            <span className="font-bold text-lg">
              {/* 
                -------- ปรับตามใช้งานจริง --------
              */}
              สร้างข้อมูลใหม่
              {/* 
                --------------------------------
              */}
            </span>
          </Link>

          {/* ======================================== */}
          {/* 🌟 (จบ) ปุ่มสร้างข้อมูลใหม่ในรูปแบบ Ghost Card */}
          {/* ======================================== */}

          {/* ==================== */}
          {/* 🌟 Render ข้อมูล */}
          {/* ==================== */}

          {
            //
            templateData // ปรับตามใช้งานจริง
              //
              .map(
                (
                  //
                  temp, // ปรับตามใช้งานจริง
                  //
                ) => (
                  <div
                    key={
                      //
                      temp.id // ปรับตามใช้งานจริง
                      //
                    }
                    className="p-6 border rounded-2xl shadow-sm bg-white hover:shadow-md transition-all flex flex-col items-start"
                  >
                    {/*  */}
                    {/* ============= */}
                    {/* 🌟 โลโก้ */}
                    {/* ============= */}

                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 font-bold text-xl">
                      {/* เอาตัวอักษรตัวแรกของชื่อมาทำเป็นโลโก้จำลอง */}
                      {
                        //
                        temp.name // ปรับตามใช้งานจริง
                          //
                          .charAt(0)
                          .toUpperCase()
                      }
                    </div>

                    {/* ============= */}
                    {/* 🌟 (จบ) โลโก้ */}
                    {/* ============= */}

                    {/* ====================== */}
                    {/* 🌟 ชื่อเต็มของรายการ */}
                    {/* ====================== */}

                    <h3 className="text-lg font-bold text-gray-800">
                      {
                        //
                        temp.name // ปรับตามใช้งานจริง
                        //
                      }
                    </h3>

                    {/* ====================== */}
                    {/* 🌟 (จบ) ชื่อเต็มของรายการ */}
                    {/* ====================== */}

                    {/* ================= */}
                    {/* 🌟 รายละเอียด */}
                    {/* ================= */}

                    <p className="text-sm text-gray-500 mt-1 mb-6">
                      {/* 
                        -------- ปรับตามใช้งานจริง --------
                      */}
                      ID:{" "}
                      <span className="font-mono text-xs">
                        {temp.id.slice(0, 8)}...
                      </span>
                      {/* 
                        --------------------------------
                      */}
                    </p>

                    {/* ================= */}
                    {/* 🌟 (จบ) รายละเอียด */}
                    {/* ================= */}

                    {/* ================= */}
                    {/* 🌟 ปุ่มกดเลือก */}
                    {/* ================= */}

                    <Link
                      href={
                        //
                        `/template/${temp.id}/server-query` // ปรับตามใช้งานจริง
                        //
                      }
                      className="mt-auto px-4 py-2 font-medium rounded-lg w-full transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {/* 
                        -------- ปรับตามใช้งานจริง --------
                      */}
                      เลือก...
                      {/* 
                        --------------------------------
                      */}
                    </Link>

                    {/* ================= */}
                    {/* 🌟 (จบ) ปุ่มกดเลือก */}
                    {/* ================= */}
                    {/*  */}
                  </div>
                ),
              )
          }

          {/* ==================== */}
          {/* 🌟 (จบ) Render ข้อมูล */}
          {/* ==================== */}
          {/*  */}
        </div>

        {/* ===================== */}
        {/* (จบ) ส่วนแสดงผล: การ์ด */}
        {/* ===================== */}

        {/* =========================== */}
        {/* ส่วนแสดงผล: Data Table */}
        {/* =========================== */}

        <div className="w-full overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
          <table className="w-full text-left text-sm text-gray-600">
            {/*  */}
            {/* =================== */}
            {/* หัวตาราง (Head) */}
            {/* =================== */}

            <thead className="bg-gray-50 text-gray-800 border-b border-gray-200">
              {/* 
                -------- ปรับตามใช้งานจริง --------
              */}
              <tr>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">ชื่อรายการ</th>
                <th className="px-6 py-4 font-semibold text-right">จัดการ</th>
              </tr>
              {/* 
                --------------------------------
              */}
            </thead>

            {/* =================== */}
            {/* (จบ) หัวตาราง (Head) */}
            {/* =================== */}

            {/* ======================= */}
            {/* ข้อมูลในตาราง (Body) */}
            {/* ======================= */}

            <tbody className="divide-y divide-gray-100">
              {
                //
                templateData // ปรับตามใช้งานจริง
                  //
                  .map(
                    (
                      //
                      temp, // ปรับตามใช้งานจริง
                      //
                    ) => (
                      <tr
                        key={
                          //
                          temp.id // ปรับตามใช้งานจริง
                          //
                        }
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {/*  */}
                        {/* =========== */}
                        {/* Column */}
                        {/* =========== */}

                        {/* คอลัมน์: ID */}
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          {
                            //
                            temp.id // ปรับตามใช้งานจริง
                              //
                              .slice(0, 8)
                          }
                          ...
                        </td>

                        {/* คอลัมน์: ชื่อรายการ */}
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {
                            //
                            temp.name // ปรับตามใช้งานจริง
                            //
                          }
                        </td>

                        {/* คอลัมน์: Action */}
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={
                              //
                              `/template/${temp.id}/server-query` // ปรับตามใช้งานจริง
                              //
                            }
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            เลือก
                          </Link>
                        </td>

                        {/* =========== */}
                        {/* (จบ) Column */}
                        {/* =========== */}
                        {/*  */}
                      </tr>
                    ),
                  )
              }
            </tbody>

            {/* ======================= */}
            {/* (จบ) ข้อมูลในตาราง (Body) */}
            {/* ======================= */}
            {/*  */}
          </table>

          {/* ============================== */}
          {/* กรณีไม่มีข้อมูล (Empty State) */}
          {/* ============================== */}

          {
            //
            templateData.length === 0 && ( // ปรับตามใช้งานจริง
              //
              <div className="py-12 text-center text-gray-500">ไม่พบข้อมูล</div>
            )
          }

          {/* ============================== */}
          {/* (จบ) กรณีไม่มีข้อมูล (Empty State) */}
          {/* ============================== */}
          {/*  */}
        </div>

        {/* =========================== */}
        {/* (จบ) ส่วนแสดงผล: Data Table */}
        {/* =========================== */}

        {/* ===================== */}
        {/* ส่วนแสดงผล: Form */}
        {/* ===================== */}

        <MethodTemplateForm
          //
          // ปรับตามใช้งานจริง
          valueOne={"valueOne"}
          skipErrorCodes={[]}
          className=""
          //
        />

        {/* ===================== */}
        {/* (จบ) ส่วนแสดงผล: Form */}
        {/* ===================== */}

        {/* ========================= */}
        {/* ส่วนแสดงผล MENU CARD */}
        {/* ========================= */}

        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            เลือกเมนูที่ต้องการจัดการ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/*  */}
            {/* =================== */}
            {/* 🌟 รายการ Menu */}
            {/* =================== */}

            {/* =========== */}
            {/* เมนูที่ 1 */}
            {/* =========== */}

            <Link
              href={`/work-schedule/admin/${templateId}/position`}
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

            {/* =========== */}
            {/* (จบ) เมนูที่ 1 */}
            {/* =========== */}

            {/* =========== */}
            {/* เมนูที่ 2 */}
            {/* =========== */}

            <Link
              href={`/work-schedule/admin/${templateId}/staff`}
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

            {/* =========== */}
            {/* (จบ) เมนูที่ 2 */}
            {/* =========== */}

            {/* =================== */}
            {/* 🌟 (จบ) รายการ Menu */}
            {/* =================== */}
            {/*  */}
          </div>
        </div>

        {/* ========================= */}
        {/* (จบ) ส่วนแสดงผล MENU CARD */}
        {/* ========================= */}

        {/* ============================= */}
        {/* ส่วนแสดงผล MENU CARD (2) */}
        {/* ============================= */}

        <div>
          {/* หัวข้อ Portal */}
          <div className="w-full max-w-5xl text-center mt-8">
            <h2 className="text-3xl font-bold text-gray-800">
              แอปพลิเคชันของคุณ
            </h2>
            <p className="text-gray-500 mt-2">
              เลือกโปรแกรมที่คุณต้องการใช้งานจาก Ecosystem
            </p>
          </div>

          {/* ตะแกรง Grid โชว์โปรแกรม 3 ตัว */}
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* โปรแกรมที่ 1: Toothcraft */}
            {/* ชั่วคราว: พาไปที่หน้า organizations ก่อน เพราะปกติต้องเลือกร้านก่อนเข้าแอป */}
            {/* <Link
            // ปรับตามใช้งานจริง
            href="/organizations"
            className="p-6 border rounded-2xl shadow-sm bg-white hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform font-bold text-3xl">
              🦷
            </div>
            <h3 className="text-lg font-bold text-gray-800">Toothcraft</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              ระบบบริหารจัดการคลินิกทันตกรรมครบวงจร
            </p>
            <button className="mt-auto px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg w-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
              เปิดใช้งาน
            </button>
          </Link> */}

            {/* 🌟 โปรแกรมที่ 2: Work Schedule System (ของจริง!) */}
            <Link
              href="/work-schedule"
              className="p-6 border border-purple-100 rounded-2xl shadow-sm bg-white hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* ป้ายกำกับ New */}
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                ใหม่
              </div>
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform font-bold text-3xl">
                🗓️
              </div>
              <h3 className="text-lg font-bold text-gray-800">Work Schedule</h3>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                ระบบบริหารตารางการทำงานและจัดการกะ
              </p>
              <button className="mt-auto px-4 py-2 bg-purple-50 text-purple-600 font-medium rounded-lg w-full group-hover:bg-purple-600 group-hover:text-white transition-colors">
                เข้าสู่ระบบจัดเวร
              </button>
            </Link>

            {/* โปรแกรมที่ 3: Coming Soon */}
            <div className="p-6 border border-dashed border-gray-300 rounded-2xl bg-gray-50 flex flex-col items-center text-center opacity-70">
              <div className="w-16 h-16 bg-gray-200 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
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
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-600">Coming Soon</h3>
              <p className="text-sm text-gray-400 mt-2 mb-6">
                แอปพลิเคชันใหม่กำลังอยู่ในช่วงพัฒนา
              </p>
              <button
                disabled
                className="mt-auto px-4 py-2 bg-gray-200 text-gray-500 font-medium rounded-lg w-full cursor-not-allowed"
              >
                เร็วๆ นี้
              </button>
            </div>
          </div>
        </div>

        {/* ============================= */}
        {/* (จบ) ส่วนแสดงผล MENU CARD (2) */}
        {/* ============================= */}

        {/* ==================== */}
        {/* 🌟 Render ข้อมูล */}
        {/* ==================== */}

        {
          //
          templateData // ปรับตามใช้งานจริง
            //
            .map(
              (
                //
                temp, // ปรับตามใช้งานจริง
                //
              ) => (
                <div
                  key={
                    //
                    temp.id // ปรับตามใช้งานจริง
                    //
                  }
                  className={cn(
                    "p-6 border rounded-2xl shadow-sm bg-white hover:shadow-md transition-all flex flex-col items-start",
                    "relative", // 💡 สำคัญมาก: เพิ่ม relative เพื่อให้เมนู Dropdown อิงพิกัดลอยตัวจากการ์ดใบนี้
                  )}
                >
                  {/* 
                      ======================================================= 
                      🌟 แถบด้านบนสุด: โลโก้ (ซ้าย) และ ปุ่มเมนู 3 จุด (ขวา) 
                      ======================================================= 
                    */}
                  <div className="flex items-start justify-between w-full mb-4">
                    {/*  */}
                    {/* ============= */}
                    {/* โลโก้ */}
                    {/* ============= */}

                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shrink-0">
                      {/* เอาตัวอักษรตัวแรกของชื่อมาทำเป็นโลโก้จำลอง */}
                      {
                        //
                        temp.name // ปรับตามใช้งานจริง
                          //
                          .charAt(0)
                          .toUpperCase()
                      }
                    </div>

                    {/* ============= */}
                    {/* (จบ) โลโก้ */}
                    {/* ============= */}

                    {/* ======================= */}
                    {/* 🌟 ปุ่มตัวเลือก (Dropdown) */}
                    {/* ======================= */}

                    {/* 
                        💡 ทริคชั่วคราว: ใส่ group/menu เอาไว้เพื่อให้ทดสอบแสดงผลได้ด้วยการเอาเมาส์ Hover 
                        (ในการใช้งานจริง แนะนำให้ใช้ State (เช่น onClick เปิด/ปิด) หรือ Library อย่าง Radix UI / Headless UI แทนการ Hover ครับ)
                      */}
                    <div className="relative group/menu">
                      {/* 🔘 ปุ่ม 3 จุด */}
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>

                      {/* 
                          📦 กล่องเมนู (Card Style Dropdown)
                          - ลอยอยู่ด้านขวา (right-0)
                          - มีขอบมนและเงาแยกออกจากการ์ดหลัก (rounded-xl shadow-lg)
                        */}
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg flex flex-col overflow-hidden z-10 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all origin-top-right">
                        {/* ตัวเลือก: รายละเอียด */}
                        <Link
                          href={
                            `/template/${temp.id}/details` // Redirect ไปหน้า Details (ปรับตามจริง)
                          }
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          รายละเอียดข้อมูล
                        </Link>

                        {/* เส้นคั่นบางๆ แบ่งโซน */}
                        <div className="h-px bg-gray-100 w-full" />

                        {/* ตัวเลือก: ลบรายการ (สื่อความหมายด้วยสีแดง) */}
                        <Link
                          href={
                            `/template/${temp.id}/delete-confirm` // Redirect ไปหน้า Confirm Delete (ปรับตามจริง)
                          }
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          ลบรายการนี้
                        </Link>
                      </div>
                    </div>

                    {/* ======================= */}
                    {/* 🌟 (จบ) ปุ่มตัวเลือก */}
                    {/* ======================= */}
                    {/*  */}
                  </div>
                  {/* 
                      ======================================================= 
                      🌟 (จบ) แถบด้านบนสุด
                      ======================================================= 
                    */}

                  {/* ====================== */}
                  {/* 🌟 ชื่อเต็มของรายการ */}
                  {/* ====================== */}

                  <h3 className="text-lg font-bold text-gray-800">
                    {
                      //
                      temp.name // ปรับตามใช้งานจริง
                      //
                    }
                  </h3>

                  {/* ====================== */}
                  {/* 🌟 (จบ) ชื่อเต็มของรายการ */}
                  {/* ====================== */}

                  {/* ================= */}
                  {/* 🌟 รายละเอียด */}
                  {/* ================= */}

                  <p className="text-sm text-gray-500 mt-1 mb-6">
                    {/* 
                        -------- ปรับตามใช้งานจริง --------
                      */}
                    ID:{" "}
                    <span className="font-mono text-xs">
                      {temp.id.slice(0, 8)}...
                    </span>
                    {/* 
                        --------------------------------
                      */}
                  </p>

                  {/* ================= */}
                  {/* 🌟 (จบ) รายละเอียด */}
                  {/* ================= */}

                  {/* ================= */}
                  {/* 🌟 ปุ่มกดเลือก (เปิดทำงาน/เลือกใช้) */}
                  {/* ================= */}

                  <Link
                    href={
                      //
                      `/template/${temp.id}/server-query` // ปรับตามใช้งานจริง
                      //
                    }
                    className="mt-auto px-4 py-2 font-medium rounded-lg w-full text-center transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    {/* 
                        -------- ปรับตามใช้งานจริง --------
                      */}
                    เลือกใช้งาน
                    {/* 
                        --------------------------------
                      */}
                  </Link>

                  {/* ================= */}
                  {/* 🌟 (จบ) ปุ่มกดเลือก */}
                  {/* ================= */}
                  {/*  */}
                </div>
              ),
            )
        }

        {/* ==================== */}
        {/* 🌟 (จบ) Render ข้อมูล */}
        {/* ==================== */}
        {/*  */}
      </div>

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
      {/*  */}
    </>
  );
}

// อย่าลืมไปลงทะเบียน protected route ใน src/proxy.ts
