// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

// CSR - Client Side Rendering                เหมาะกับ query ข้อมูลขนาดใหญ่
// SSR - Server Side Rendering (Hydration)    เหมาะกับ query ข้อมูลขนาดเล็ก
// SSR - Server Side Rendering (initialData)  เหมาะกับ มี DB สำหรับ GET แยกออกมาอีกตัว (สามารถใช้โควต้าได้อย่างสิ้นเปลือง แต่ UX จะเร็วและดีกว่า)

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { useState } from "react";

import {
  // ปรับตามใช้งานจริง
  programFeatureQueries,

  // ปรับตามใช้งานจริง
} from "@/features/[program]/[feature]/[program]-[feature].queries";
// ErrorCode จากแต่ละ AccessControl
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

// Check ErrorQuery
import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { thisPathErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

// การเรียกใช้แบบนอก {} ชื่อไม่จำเป็นต้องตรงกับในไฟล์ ./loading.tsx หรือ ./error.tsx ก็ได้ (มันจะไปเอา default มาใช้อยู่แล้ว)
import ErrorQuery from "./error";

import Loading from "./loading";

import { cn } from "@/lib/utils";

import { ChildrenHeader } from "@/components/children-header";

export default function Client({
  //
  // ปรับตามใช้งานจริง
  templateId,
  // eslint-disable-next-line
  templateQueryId,
}: {
  // ปรับตามใช้งานจริง
  templateId: string;
  templateQueryId?: string;
}) {
  const { getToken, userId, isLoaded } = useAuth();

  // eslint-disable-next-line
  const [startDateTime, setStartDateTime] = useState<string>("");
  // eslint-disable-next-line
  const [endDateTime, setEndDateTime] = useState<string>("");

  // ==>>==>>== 🚀 ดึงข้อมูล Query ==<<==<<==

  const {
    data: dataQuery,
    isLoading,
    isFetching,
    error: errorQuery,
    refetch,
    dataUpdatedAt,
  } = useQuery(
    // ปรับตามใช้งานจริง
    programFeatureQueries.queryGetAvailableOtherProgramFeatures(
      //
      // ปรับตามใช้งานจริง
      "string1",
      "string2",
      "string3",

      // ปรับตามใช้งานจริง
      userId,
      getToken,

      // ปรับตามใช้งานจริง
      AccessControlErrorCode.verifyOrganizationAccess,
    ),
  );

  // ==>>==>>== (จบ) 🚀 ดึงข้อมูล Query ==<<==<<==

  // ==>>==>>== ดักจับ Error (จาก Query) ==<<==<<==

  const { isRedirecting, targetUrl, errorCode } = useEffectCheckError(
    errorQuery,

    // ปรับตามใช้งานจริง
    thisPathErrorCodeRedirectList,

    dataQuery,
  );

  // ==>>==>>== (จบ) ดักจับ Error (จาก Query) ==<<==<<==

  // ==>>==>>== Redirect UI ==<<==<<==

  // จำเป็นกรณี Client มี First Query  หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช

  // ป้องกันหน้าจอกระพริบ (UI Flash)
  // ทำงานเฉพาะตอนโหลดหน้าจอ เนื่องจากใช้ if() = ถ้าเกิด error จาก fetching จะไม่กระพริบ

  if (isRedirecting && targetUrl && errorCode) {
    return <RedirectUI targetUrl={targetUrl} errorCode={errorCode} />;
  }

  // ==>>==>>== (จบ) Redirect UI ==<<==<<==

  // ==>>==>>== Error UI (โหลดครั้งแรก) ==<<==<<==

  // จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  // ==>>==>>== (จบ) Error UI (โหลดครั้งแรก) ==<<==<<==

  // ==>>==>>== Loading UI + ตรวจสอบความพร้อมข้อมูลที่ต้องใช้แสดงผลก่อนแสดงผลจริง ==<<==<<==

  // จำเป็นกรณี Client มี First Query หรือ บัญชี userId เปลี่ยนโดยไม่ได้รีเฟรช

  // isLoaded คือ จาก useAuth (Clerk) ป้องกันจังหวะแรกที่ยังโหลด userId ไม่เสร็จ

  if (!isLoaded || isLoading || dataQuery === undefined) {
    return <Loading />;
  }

  // ==>>==>>== (จบ) Loading UI + ตรวจสอบความพร้อมข้อมูลที่ต้องใช้แสดงผลก่อนแสดงผลจริง ==<<==<<==

  // ==>>==>>== จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย ==<<==<<==

  // ปรับตามใช้งานจริง
  // const positions = dataQuery.positions;

  // ==>>==>>== (จบ) จัดข้อมูลใส่ตัวแปร เพื่อให้นำไปเขียนใน UI ได้เป็นระเบียบและอ่านง่าย ==<<==<<==

  // ==>>==>>== ฟังก์ชันเฉพาะของหน้า ==<<==<<==

  // ==>>==>>== (จบ) ฟังก์ชันเฉพาะของหน้า ==<<==<<==

  // ==>>==>>== ส่วนแสดงผล UI หลัก (snippet จากใน template/page.tsx) ==<<==<<==

  return (
    <>
      {/* ==>>==>>== Main UI (children) ==<<==<<== */}

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
            // ปรับตามใช้งานจริง
            `/template/${templateId}/server-query`
          }
          //

          // กรณี: ใช้ create button
          createHref={
            // ปรับตามใช้งานจริง
            `/template/${templateId}/server-query`
          }
          createLabel={
            // ปรับตามใช้งานจริง
            `สร้างข้อมูลใหม่ / สร้าง...ใหม่`
          }
          // (จบ) กรณี: ใช้ create button

          // กรณี: ใช้ status bar
          isFetching={isFetching}
          errorQuery={errorQuery}
          refetch={refetch}
          dataUpdatedAt={dataUpdatedAt}
          // (จบ) กรณี: ใช้ status bar
        />
      </div>

      {/* ==>>==>>== (จบ) Main UI (children) ==<<==<<== */}
    </>
  );
}
