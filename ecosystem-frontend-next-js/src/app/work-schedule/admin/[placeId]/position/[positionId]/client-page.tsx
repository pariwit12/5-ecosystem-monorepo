// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import Loading from "./loading";
import ErrorQuery from "./error";

import { workSchedulePositionQueries } from "@/features/work-schedule/position/work-schedule-position.queries";

import { cn } from "@/lib/utils";

import Link from "next/link";
import { ChildrenHeader } from "@/components/children-header";
import { MenuGrid } from "@/components/menu-grid/menu-gird";
import { MenuCard } from "@/components/menu-grid/menu-card";
import { CalendarIcon, SettingIcon } from "@/components/menu-grid/icon";

export default function WorkScheduleAdminPositionIdClient({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  const router = useRouter();
  const { getToken, userId, isLoaded } = useAuth();

  const {
    data: dataQuery,
    isLoading,
    isFetching,
    error: errorQuery,
    refetch,
    dataUpdatedAt,
  } = useQuery(
    workSchedulePositionQueries.queryGetWorkSchedulePositionById(
      positionId,

      userId,
      getToken,

      [
        ErrorCode.PERSON_NOT_FOUND,
        ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
        ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND,
        ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
      ],
    ),
  );

  useEffect(() => {
    if (errorQuery && isAxiosError(errorQuery)) {
      const errorCode = errorQuery.response?.data?.errorCode;

      if ([ErrorCode.PERSON_NOT_FOUND].includes(errorCode)) {
        router.push(`/person/new?error=${errorCode}`);

        return;
      }

      if (
        [
          ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
          ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        ].includes(errorCode)
      ) {
        router.push(`/work-schedule?error=${errorCode}`);

        return;
      }

      if (
        [
          ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND,
          ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
        ].includes(errorCode)
      ) {
        router.push(
          `/work-schedule/admin/${placeId}/position?error=${errorCode}`,
        );

        return;
      }
    }

    if (errorQuery && dataQuery !== undefined) {
      toast.error(
        "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
      );
    }
  }, [errorQuery, router, dataQuery, placeId]);

  if (!isLoaded || isLoading) {
    return <Loading />;
  }

  if (
    errorQuery &&
    dataQuery === undefined &&
    isAxiosError(errorQuery) &&
    [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
      ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_POSITION_DELETED,
    ].includes(errorQuery.response?.data?.errorCode)
  ) {
    return <Loading />;
  }

  if (errorQuery && dataQuery === undefined) {
    return <ErrorQuery reset={() => refetch()} />;
  }

  if (dataQuery === undefined) {
    return <Loading />;
  }

  const position = dataQuery;

  return (
    <div
      className={cn(
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
        title={position.name}
        description="เลือกเมนูที่ต้องการจัดการหรือเข้าถึง"
        backHref={`/work-schedule/admin/${placeId}/position`}
        //

        // กรณี: ใช้ status bar
        isFetching={isFetching}
        errorQuery={errorQuery}
        refetch={refetch}
        dataUpdatedAt={dataUpdatedAt}
        // (จบ) กรณี: ใช้ status bar
        //
      />

      <MenuGrid
        //
        title={`เมนูการจัดการ`}
        minWidth={10}
        //
      >
        {/* ==================================== */}
        {/* เมนู: สีหลัก (เน้น หรือ ใช้งานบ่อยสุด) */}
        {/* ==================================== */}

        <Link
          href={`/work-schedule/admin/${placeId}/position/${positionId}/slot`}
          className={cn(
            "group",

            "flex",
            "flex-col",

            "items-center",
            "text-center",

            "px-4",
            "py-6",

            "relative",

            "overflow-hidden",

            "border-2",
            "rounded-2xl",

            "bg-blue-50/50",
            "border-blue-100",

            "cursor-pointer",

            "transition-all",
            "hover:bg-blue-50",
            "hover:border-blue-300",
            "hover:shadow-md",
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
              "text-lg",

              "font-bold",

              "text-gray-900",
              "group-hover:text-blue-700",
              "transition-colors",
            )}
          >
            ตารางเวร
          </h4>
          <p
            className={cn(
              "text-sm",

              "text-gray-500",

              "mt-1",
            )}
          >
            จัดการและตรวจสอบตารางเวรของ{position.name}
          </p>
        </Link>

        {/* ==================================== */}
        {/* (จบ) เมนู: สีหลัก (เน้น หรือ ใช้งานบ่อยสุด) */}
        {/* ==================================== */}

        {/* ========================= */}
        {/* เมนูมาตรฐาน: แบบร่าง */}
        {/* ========================= */}

        <Link
          href={`/work-schedule/admin/${placeId}/position/${positionId}/slot-template`}
          className={cn(
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
              className={cn("h-6 w-6")}
              xmlns="http://www.w3.org/2000/svg"
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
              "text-lg",

              "font-bold",

              "text-gray-800",
            )}
          >
            แบบร่าง
          </h4>
          <p
            className={cn(
              "text-sm",

              "text-gray-500",

              "mt-1",
            )}
          >
            จัดการและตรวจสอบข้อมูลแบบร่างสำหรับตารางเวรของ{position.name}
          </p>
        </Link>

        {/* ========================= */}
        {/* (จบ) เมนูมาตรฐาน: แบบร่าง */}
        {/* ========================= */}

        <MenuCard
          href={`/work-schedule/admin/${placeId}/position/${positionId}/slot-type`}
          icon={<CalendarIcon />}
          title={`ประเภทเวร`}
          description={`จัดการและตรวจสอบประเภทเวรของ${position.name}`}
        />

        {/* ========================= */}
        {/* เมนูมาตรฐาน: พนักงาน */}
        {/* ========================= */}

        <Link
          href={`/work-schedule/admin/${placeId}/position/${positionId}/staff-position`}
          className={cn(
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
              className={cn("h-6 w-6")}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h4
            className={cn(
              "text-lg",

              "font-bold",

              "text-gray-800",
            )}
          >
            พนักงาน
          </h4>
          <p
            className={cn(
              "text-sm",

              "text-gray-500",

              "mt-1",
            )}
          >
            จัดการและตรวจสอบข้อมูลพนักงานของ{position.name}
          </p>
        </Link>

        {/* ========================= */}
        {/* (จบ) เมนูมาตรฐาน: พนักงาน */}
        {/* ========================= */}

        <MenuCard
          href={`/work-schedule/admin/${placeId}/position/${positionId}/min-max`}
          icon={<SettingIcon />}
          title={`ต่ำสุด - สูงสุด`}
          description={`กำหนดจำนวนพนักงานต่ำสุดและสูงสุดสำหรับแต่ละช่วงเวลาของ${position.name}`}
        />
      </MenuGrid>
    </div>
  );
}
