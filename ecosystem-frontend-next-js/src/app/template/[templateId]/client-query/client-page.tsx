// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

// CSR - Client Side Rendering                เหมาะกับ query ข้อมูลขนาดใหญ่
// SSR - Server Side Rendering (Hydration)    เหมาะกับ query ข้อมูลขนาดเล็ก
// SSR - Server Side Rendering (initialData)  เหมาะกับ มี DB สำหรับ GET แยกออกมาอีกตัว (สามารถใช้โควต้าได้อย่างสิ้นเปลือง แต่ UX จะเร็วและดีกว่า)

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

// ตรวจสอบว่าเป็น Error เป็นรูปแบบ Error จาก Axios หรือไม่
import { isAxiosError } from "axios";

import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

// ข้อความที่เตรียมไว้สำหรับ ErrorCode แต่ละประเภท
import { USER_ERROR_MESSAGES } from "@/constants/error-messages";

// ErrorCode จากแต่ละ AccessControl
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

// Redirect From ErrorQuery
import { useEffectRedirectFromErrorQuery } from "@/hooks/use-effect-redirect-from-error-query";

import { cn } from "@/lib/utils";

// eslint-disable-next-line
import Link from "next/link";

// การเรียกใช้แบบนอก {} ชื่อไม่จำเป็นต้องตรงกับในไฟล์ ./loading.tsx หรือ ./error.tsx ก็ได้ (มันจะไปเอา default มาใช้อยู่แล้ว)
import Loading from "./loading";
import ErrorQuery from "./error";

import { ChildrenHeader } from "@/components/children-header";
// eslint-disable-next-line
import { MenuGrid } from "@/components/menu-grid/menu-gird";
// eslint-disable-next-line
import { MenuCard } from "@/components/menu-grid/menu-card";
import {
  // eslint-disable-next-line
  CalendarIcon,
  // eslint-disable-next-line
  PersonIcon,
  // eslint-disable-next-line
  DetailNoteIcon,
  // eslint-disable-next-line
  DocumentTextIcon,
  // eslint-disable-next-line
  SettingIcon,
  // eslint-disable-next-line
  PlusIcon,
} from "@/components/menu-grid/icon";

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
  // eslint-disable-next-line
  templateQueryId,
}: {
  //
  // ปรับตามใช้งานจริง
  templateId: string;
  templateQueryId?: string;
}) {
  // eslint-disable-next-line
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
    dataUpdatedAt,
    //
  } = useQuery(
    //
    // ปรับตามใช้งานจริง
    templateQueries

      // ปรับตามใช้งานจริง
      .queryGetTemplate(
        //
        // ปรับตามใช้งานจริง
        "string1",
        "string2",
        "string3",

        // ปรับตามใช้งานจริง
        userId,
        getToken,

        // ปรับตามใช้งานจริง
        AccessControlErrorCode.verifyOrganizationAccess, // ปรับตามใช้งานจริง
      ),
  );

  // =================================
  // 🚀 (จบ) ดึงข้อมูล Query
  // =================================

  // ===============================================
  // 🌟 ดักจับ Error (จาก Query) แล้ว Redirect
  // ===============================================

  // ปรับตามใช้งานจริง
  useEffectRedirectFromErrorQuery
    //
    // ปรับตามใช้งานจริง
    .ErrorCodeVerifyWorkSchedulePositionByWorkScheduleAdmin({
      //

      // ปรับตามใช้งานจริง
      errorQuery: errorQuery,
      dataQuery: dataQuery,
      placeId: "placeId",
    });

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
    // ปรับตามใช้งานจริง
    AccessControlErrorCode.verifyOrganizationAccess // ปรับตามใช้งานจริง
      .includes(errorQuery.response?.data?.errorCode)
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
        <ChildrenHeader
          //
          title={
            //
            // ปรับตามใช้งานจริง

            // `${dataQuery.name}`
            `รายการ...`
            // `สร้าง...ใหม่`
          }
          description={
            //
            // ปรับตามใช้งานจริง

            // `เลือกเมนูที่ต้องการจัดการหรือเข้าถึง`
            `กรอกรายละเอียดและบันทึกเพื่อดำเนินการต่อ`
            // `จัดการและตรวจสอบข้อมูลรายการทั้งหมดในระบบ`
          }
          backHref={
            //
            `/template/${templateId}/server-query` // ปรับตามใช้งานจริง
            //
          }
          //

          // กรณี: ใช้ create button
          createHref={
            //
            `/template/${templateId}/server-query` // ปรับตามใช้งานจริง
            //
          }
          createLabel={
            //
            `สร้างข้อมูลใหม่ / สร้าง...ใหม่` // ปรับตามใช้งานจริง
            //
          }
          // (จบ) กรณี: ใช้ create button

          // กรณี: ใช้ status bar
          isFetching={isFetching}
          errorQuery={errorQuery}
          refetch={refetch}
          dataUpdatedAt={dataUpdatedAt}
          // (จบ) กรณี: ใช้ status bar
          //
        />
      </div>

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
      {/*  */}
    </>
  );
}
