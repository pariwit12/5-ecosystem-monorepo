// ------------------------------------------------------------------------
// Pattern: SSR (initialData) + Client Fetching
// ------------------------------------------------------------------------

// CSR - Client Side Rendering                เหมาะกับ query ข้อมูลขนาดใหญ่
// SSR - Server Side Rendering (Hydration)    เหมาะกับ query ข้อมูลขนาดเล็ก
// SSR - Server Side Rendering (initialData)  เหมาะกับ มี DB สำหรับ GET แยกออกมาอีกตัว (สามารถใช้โควต้าได้อย่างสิ้นเปลือง แต่ UX จะเร็วและดีกว่า)

"use client";

import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

// ตรวจสอบว่าเป็น Error เป็นรูปแบบ Error จาก Axios หรือไม่
import { isAxiosError } from "axios";

import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

// ข้อความที่เตรียมไว้สำหรับ ErrorCode แต่ละประเภท
import { USER_ERROR_MESSAGES } from "@/constants/error-messages";

// การเรียกใช้แบบนอก {} ชื่อไม่จำเป็นต้องตรงกับในไฟล์ ./loading.tsx หรือ ./error.tsx ก็ได้ (มันจะไปเอา default มาใช้อยู่แล้ว)
import Loading from "./loading";
import ErrorQuery from "./error";

// ===================
// Import Queries
// ===================

import {
  // ปรับตามใช้งานจริง
  templateQueries,

  // ปรับตามใช้งานจริง
} from "@/features/[template]/[template].queries";

// ===================
// (จบ) Import Queries
// ===================

// ----------- Import Type (Response from API) -----------
import {
  // ปรับตามใช้งานจริง
  GetTemplateResponse,

  // ปรับตามใช้งานจริง
} from "@backend/modules/[template]/queries/get-[template].query";

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

  // ปรับตามใช้งานจริง
  serverUserId,
  initialData,
  //
}: {
  //
  // ปรับตามใช้งานจริง
  templateId: string;

  // ปรับตามใช้งานจริง
  serverUserId: string | null;
  initialData: GetTemplateResponse; // ปรับตามใช้งานจริง
  //
}) {
  const router = useRouter();
  const { getToken, userId: clientUserId, isLoaded } = useAuth();

  // ตรวจสอบว่า userId ตอนนี้ เหมือนกับที่ใช้ดึงข้อมูล initialData (ที่ Server) หรือไม่
  const isValidInitialData = clientUserId === serverUserId;

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
    dataUpdatedAt,
    //
  } = useQuery({
    //
    // ปรับตามใช้งานจริง
    ...templateQueries

      // ปรับตามใช้งานจริง
      .queryGetTemplate(
        //
        // ปรับตามใช้งานจริง
        "string1",
        "string2",
        "string3",

        // ปรับตามใช้งานจริง
        clientUserId,
        getToken,

        // ปรับตามใช้งานจริง
        [
          // ปรับตามใช้งานจริง
          ErrorCode.ORGANIZATION_NOT_FOUND,
          ErrorCode.ORGANIZATION_DELETED,
          ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
        ],
      ),

    // ใส่ initialData ที่ได้จาก Server Component
    // ปรับตามใช้งานจริง
    initialData: isValidInitialData ? initialData : undefined,
    //
  });

  // =================================
  // 🚀 (จบ) ดึงข้อมูล Query
  // =================================

  // ===============================================
  // 🌟 ดักจับ Error (จาก Query) แล้ว Redirect
  // ===============================================

  useEffect(() => {
    //
    // เช็คว่า 1. มี Error และ 2. เป็น Error จาก Axios (บอก TS ให้ยอมให้เราดึง .response ได้)

    if (errorQuery && isAxiosError(errorQuery)) {
      //
      // ปรับตามใช้งานจริง (จาก Backend)
      const errorCode = errorQuery.response?.data?.errorCode;

      // ปลายทาง: URL-1
      if (
        [
          //
          // ปรับตามใช้งานจริง
          ErrorCode.ORGANIZATION_NOT_FOUND,
          ErrorCode.ORGANIZATION_DELETED,
          ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
          //
        ].includes(errorCode)
      ) {
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

  // =================================================================================
  // Loading UI (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // =================================================================================

  // isLoaded คือ จาก useAuth (Clerk) ป้องกันจังหวะแรกที่ยังโหลด userId ไม่เสร็จ

  if (!isLoaded || isLoading) {
    return <Loading />;
  }

  // =================================================================================
  // (จบ) Loading UI (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // =================================================================================

  // ==================================================================================================
  // Flash UI (สำหรับ Redirect) (จำเป็นกรณี Client มี First Query  หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ==================================================================================================

  // ป้องกันหน้าจอกระพริบ (UI Flash)
  // ทำงานเฉพาะตอนโหลดหน้าจอ เนื่องจากใช้ if() = ถ้าเกิด error จาก fetching จะไม่กระพริบ

  if (
    errorQuery &&
    dataQuery === undefined &&
    isAxiosError(errorQuery) &&
    [
      // ปรับตามใช้งานจริง
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
      //
    ].includes(errorQuery.response?.data?.errorCode)
  ) {
    return <Loading />;
  }

  // ==================================================================================================
  // (จบ) Flash UI (สำหรับ Redirect) (จำเป็นกรณี Client มี First Query  หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ==================================================================================================

  // ===========================================================================================================
  // Early Return: หน้าจอ Error โหลดครั้งแรก (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ===========================================================================================================

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  // ===========================================================================================================
  // (จบ) Early Return: หน้าจอ Error โหลดครั้งแรก (จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช)
  // ===========================================================================================================

  // ============================
  // 🎯 ฟังก์ชันเฉพาะของหน้า
  // ============================

  // แปลงเวลาไว้แสดงเวลา Update ล่าสุด
  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // ============================
  // 🎯 (จบ) ฟังก์ชันเฉพาะของหน้า
  // ============================

  // ===================================================
  // ตรวจสอบความพร้อมข้อมูลที่ต้องใช้แสดงผลก่อนแสดงผลจริง
  // ===================================================

  if (
    //
    // ปรับตามใช้งานจริง
    dataQuery === undefined
    //
  ) {
    return <Loading />;
  }

  // ===================================================
  // (จบ) ตรวจสอบความพร้อมข้อมูลที่ต้องใช้แสดงผลก่อนแสดงผลจริง
  // ===================================================

  // ==============================================================
  // จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // ==============================================================

  // ปรับตามใช้งานจริง
  // const positions = dataQuery.positions;

  // ==============================================================
  // (จบ) จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย
  // ==============================================================

  // ===================================================
  // ส่วนแสดงผล UI หลัก (snippet จากใน template/page.tsx)
  // ===================================================

  return (
    <>
      <Suspense fallback={null}>
        <ToastNotifier />
      </Suspense>

      {/* ========================================================================================== */}
      {/* Main UI (children) */}
      {/* ========================================================================================== */}

      <div
        className={cn(
          "@container",

          "w-full",

          "max-w-7xl",

          "mx-auto",

          "flex",
          "flex-col",
          "gap-2 sm:gap-3",

          "relative",

          "px-4 sm:px-6",

          "py-4 sm:py-6",
        )}
      >
        <div>
          <div
            className={cn(
              "flex",
              "flex-wrap",
              "items-center",
              "justify-between",

              "gap-2 sm:gap-3",

              "border-b",
              "pt-2 sm:pt-3",
              "pb-4 sm:pb-6",
            )}
          >
            <Link
              href={`/template/${templateId}/server-query`}
              className={cn(
                "p-2",

                "rounded-full",

                "text-gray-600 bg-gray-100 hover:bg-gray-200 transition",
              )}
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

            <div
              className={cn(
                "flex-1",

                "min-w-0",

                "gap-4 sm:gap-6",
              )}
            >
              <h2
                className={cn(
                  "text-2xl sm:text-3xl",

                  "truncate",

                  "font-bold text-gray-800",
                )}
              >
                รายการตำแหน่งงาน
              </h2>

              <p
                className={cn(
                  "text-xs sm:text-sm",

                  "truncate",

                  "font-mono text-gray-500",
                )}
              >
                กรอกรายละเอียดและบันทึกเพื่อดำเนินการต่อ
              </p>
            </div>

            <Link
              href={`/template/${templateId}/server-query`}
              className={cn(
                "px-4 sm:px-5 py-2 sm:py-2.5",

                "min-w-0",

                "text-xs sm:text-sm",

                "rounded-xl",

                "font-medium text-white bg-blue-500 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-colors",
              )}
            >
              <span className={cn("truncate")}>+ สร้างข้อมูลใหม่</span>
            </Link>
          </div>

          <div
            className={cn(
              "flex",
              "flex-wrap",
              "items-center",
              "justify-end",

              "h-6",

              "text-xs",
            )}
          >
            {isFetching ? (
              <span
                className={cn(
                  "flex",
                  "flex-wrap",
                  "items-center",

                  "gap-2",

                  "text-gray-500 animate-pulse",
                )}
              >
                <svg
                  className={cn(
                    "h-3.5 w-3.5",

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
            ) : errorQuery ? (
              <div
                className={cn(
                  "flex",
                  "flex-wrap",
                  "items-center",

                  "gap-2",
                )}
              >
                <span
                  className={cn(
                    "flex",
                    "flex-wrap",
                    "items-center",

                    "gap-1.5",

                    "font-medium text-red-500",
                  )}
                >
                  <svg
                    className={cn("h-3.5 w-3.5")}
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
                  onClick={() => refetch()}
                  className={cn(
                    "font-semibold underline",
                    "text-blue-600 hover:text-blue-700 transition-colors",
                    "cursor-pointer",
                  )}
                >
                  ลองใหม่
                </button>
              </div>
            ) : (
              dataUpdatedAt > 0 && (
                <div
                  className={cn(
                    "flex",
                    "flex-wrap",
                    "items-center",

                    "gap-3",
                  )}
                >
                  <span
                    className={cn(
                      "flex",
                      "flex-wrap",
                      "items-center",

                      "gap-1.5",

                      "text-gray-400",
                    )}
                  >
                    <svg
                      className={cn(
                        "h-3.5 w-3.5",

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

                  <button
                    type="button"
                    onClick={() => refetch()}
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
                      className={cn("h-3.5 w-3.5")}
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
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
      {/*  */}
    </>
  );
}
