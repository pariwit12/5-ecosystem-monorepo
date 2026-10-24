"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { workScheduleStaffPlaceQueries } from "@/features/work-schedule/staff-place/work-schedule-staff-place.queries";
import { DataStateWrapper } from "@/components/data-state-wrapper";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { HolidayForm } from "@/features/work-schedule/holiday/components/holiday-form";
import { HolidayList } from "@/features/work-schedule/holiday/components/holiday-list";
import { MyWorkScheduleCalendar } from '@/features/work-schedule/slot/components/my-work-schedule-calendar';

export default function Client({ placeId }: { placeId: string }) {
  const router = useRouter();
  const { getToken, userId, isLoaded } = useAuth();

  const { data, isLoading, error } = useQuery(
    workScheduleStaffPlaceQueries.detail(userId, getToken, placeId, [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
      ErrorCode.NOT_A_STAFF_OF_WORK_SCHEDULE_PLACE,
    ]),
  );

  useEffect(() => {
    if (error && isAxiosError(error)) {
      const errorCode = error.response?.data?.errorCode;

      if ([ErrorCode.PERSON_NOT_FOUND].includes(errorCode)) {
        router.push(`/person/new?error=${errorCode}`);
        return;
      }

      if (
        [
          ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
          ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
          ErrorCode.NOT_A_STAFF_OF_WORK_SCHEDULE_PLACE,
        ].includes(errorCode)
      ) {
        toast.error("คุณไม่มีสิทธิ์เข้าถึงสถานที่ทำงานนี้ หรือสถานที่ถูกลบแล้ว");
        router.push(`/work-schedule?error=${errorCode}`);
        return;
      }

      if (error && data !== undefined) {
        toast.error(
          "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
        );
      }
    }
  }, [error, router, data]);

  if (
    error &&
    isAxiosError(error) &&
    [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
      ErrorCode.NOT_A_STAFF_OF_WORK_SCHEDULE_PLACE,
    ].includes(error.response?.data?.errorCode)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">
        กำลังตรวจสอบสิทธิ์และพากลับไปยังหน้าที่เหมาะสม...
      </div>
    );
  }

  return (
    <DataStateWrapper
      isAuthLoaded={isLoaded}
      isQueryLoading={isLoading}
      errorQuery={error}
    >
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-wrap items-start gap-3 border-b pb-6 sm:items-center sm:gap-4">
          <Link
            href="/work-schedule"
            className="min-h-11 min-w-11 p-2 bg-muted text-muted-foreground rounded-full hover:bg-muted transition"
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
          <div className="flex-1">
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
              Staff Member
            </span>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              {data?.name || "สถานที่ทำงาน"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ข้อมูลสถานที่ทำงานและโปรไฟล์พนักงานของคุณ
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              ข้อมูลสถานที่ทำงาน
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">ชื่อสถานที่:</span>
                <p className="text-base font-semibold text-foreground">
                  {data?.name}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">ไทม์โซน (Timezone):</span>
                <p className="text-base font-mono text-foreground">
                  {data?.timezone}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              ข้อมูลพนักงานของคุณ
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">ชื่อในระบบสถานที่:</span>
                <p className="text-base font-semibold text-foreground">
                  {data?.staff.name}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">รหัสพนักงาน (ID):</span>
                <p className="break-all text-xs font-mono text-muted-foreground sm:break-words">
                  {data?.staff.id}
                </p>
              </div>
            </div>
          </div>
        </section>

        {data && (
          <section className="space-y-6">
            <MyWorkScheduleCalendar
              placeId={placeId}
              placeTimezone={data.timezone}
            />
            <HolidayForm
              placeId={placeId}
              placeTimezone={data.timezone}
            />
            <HolidayList
              placeId={placeId}
              placeTimezone={data.timezone}
            />
          </section>
        )}

        <div className="flex justify-center pt-2">
          <Link
            href="/work-schedule"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-secondary px-4 py-2 text-center text-sm font-semibold text-secondary-foreground transition hover:bg-accent sm:w-auto"
          >
            กลับหน้ารายการสถานที่ทำงาน
          </Link>
        </div>
      </main>
    </DataStateWrapper>
  );
}
