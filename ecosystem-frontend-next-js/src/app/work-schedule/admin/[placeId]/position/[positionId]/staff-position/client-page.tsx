// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { workScheduleStaffPositionQueries } from "@/features/work-schedule/staff-position/work-schedule-staff-position.queries";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";

import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import { workScheduleAdminPlaceIdPositionPositionIdStaffPositionErrorCodeRedirectList } from "./error-code-redirect-list";
import RedirectUI from "@/components/redirect/redirect-ui";

import ErrorQuery from "./error";

import Loading from "./loading";

import { cn } from "@/lib/utils";

import Link from "next/link";
import { ChildrenHeader } from "@/components/children-header";

export default function WorkScheduleAdminPositionStaffPositionClient({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  const { getToken, userId, isLoaded } = useAuth();

  const {
    data: dataQuery,
    isLoading,
    isFetching,
    error: errorQuery,
    refetch,
    dataUpdatedAt,
  } = useQuery(
    workScheduleStaffPositionQueries.queryGetStaffPositionsByPositionId(
      positionId,

      userId,
      getToken,

      AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
    ),
  );

  const { isRedirecting, targetUrl, errorCode } = useEffectCheckError(
    errorQuery,
    workScheduleAdminPlaceIdPositionPositionIdStaffPositionErrorCodeRedirectList,
    dataQuery,
  );

  if (isRedirecting && targetUrl && errorCode) {
    return <RedirectUI targetUrl={targetUrl} errorCode={errorCode} />;
  }

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  if (!isLoaded || isLoading || dataQuery === undefined) {
    return <Loading />;
  }

  const staffPositions = dataQuery.staffPositions;

  return (
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
        title={`รายการพนักงานในตำแหน่งงานนี้`}
        description={`จัดการและตรวจสอบข้อมูลรายการทั้งหมดในระบบ`}
        backHref={`/work-schedule/admin/${placeId}/position/${positionId}`}
        //

        // กรณี: ใช้ create button
        createHref={`/work-schedule/admin/${placeId}/position/${positionId}/staff-position/new`}
        createLabel={`เพิ่มพนักงานเข้าสู่ตำแหน่งงานนี้`}
        // (จบ) กรณี: ใช้ create button

        // กรณี: ใช้ status bar
        isFetching={isFetching}
        errorQuery={errorQuery}
        refetch={refetch}
        dataUpdatedAt={dataUpdatedAt}
        // (จบ) กรณี: ใช้ status bar
        //
      />

      {/* ========================================================= */}
      {/* ส่วนแสดงผล: Stacked List (สำหรับข้อมูลที่มี Column ไม่เยอะ) */}
      {/* ========================================================= */}

      <div className="w-full border border-gray-200 rounded-xl shadow-sm bg-white divide-y divide-gray-100">
        {staffPositions.map((sp) => (
          <div
            key={sp.staffId}
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
                {sp.name.charAt(0).toUpperCase()}
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
                  {sp.name}
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
                  ID: {sp.staffId.slice(0, 8)}...
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
                `/template/${sp.name}/server-query` // ปรับตามใช้งานจริง
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
        ))}

        {/* ============================== */}
        {/* กรณีไม่มีข้อมูล (Empty State) */}
        {/* ============================== */}

        {staffPositions.length === 0 && (
          <div className="py-6 text-sm text-center text-gray-500">
            ไม่พบข้อมูล
          </div>
        )}

        {/* ============================== */}
        {/* (จบ) กรณีไม่มีข้อมูล (Empty State) */}
        {/* ============================== */}
        {/*  */}
      </div>

      {/* ========================================================= */}
      {/* (จบ) ส่วนแสดงผล: Stacked List (สำหรับข้อมูลที่มี Column ไม่เยอะ) */}
      {/* ========================================================= */}
      {/*  */}
    </div>
  );
}
