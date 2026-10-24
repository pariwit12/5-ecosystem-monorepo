"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { workSchedulePlacesQueries } from "@/features/work-schedule/places/hooks/work-schedule-places.queries";

import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAxiosError } from "axios";

import { DataStateWrapper } from "@/components/data-state-wrapper";

export default function WorkScheduleListClient({ orgId }: { orgId: string }) {
  const { getToken, userId, isLoaded } = useAuth();

  const { data, isLoading, isFetching, error } = useQuery(
    workSchedulePlacesQueries.listByOrganizationId(userId, orgId, getToken, [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
    ]),
  );

  // ดึง array ออกมาใช้ (ถ้ายังไม่มีข้อมูลให้ใช้ array ว่างไปก่อน)
  const workSchedulePlaces = data?.workSchedulePlaces || [];

  const router = useRouter();

  // 🌟 ดักจับ Error และสั่งเตะออก (Redirect)
  useEffect(() => {
    // เช็คว่ามี Error และเป็น Error จาก Axios (บอก TS ให้ยอมให้เราดึง .response ได้)
    if (error && isAxiosError(error)) {
      const errorCode = error.response?.data?.errorCode;

      if ([ErrorCode.PERSON_NOT_FOUND].includes(errorCode)) {
        router.push(`/person/new?error=${errorCode}`);

        return;
      }

      if (
        [
          ErrorCode.ORGANIZATION_NOT_FOUND,
          ErrorCode.ORGANIZATION_DELETED,
          ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
        ].includes(errorCode)
      ) {
        router.push(`/organizations?error=${errorCode}`);
      }
    }
  }, [error, router]);

  // 🌟 กันหน้าจอกระพริบระหว่างเตะออก
  if (
    error &&
    isAxiosError(error) &&
    [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
    ].includes(error.response?.data?.errorCode)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        เกิดข้อผิดพลาด กำลังพากลับไปยังหน้ารายชื่อองค์กร...
      </div>
    );
  }

  // Error อื่นๆ ยังไม่ได้จัดการ ให้ global-error-modal แสดงผล แต่หน้าจอยังไม่ได้จัดการต่อ
  // if (error) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen text-destructive">
  //       เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
  //     </div>
  //   );
  // }

  return (
    <DataStateWrapper
      isAuthLoaded={isLoaded}
      isQueryLoading={isLoading}
      errorQuery={error}
    >
      {/* 🌟 3. This is your pure UI. It will ONLY render if Auth and Data are 100% ready! */}

      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
        {/* 🟢 ส่วนหัวข้อและปุ่มย้อนกลับ */}
        <div className="flex flex-wrap items-start gap-3 border-b pb-6 sm:items-center sm:gap-4">
          <Link
            href={`/organizations/${orgId}/settings`}
            className="min-h-11 min-w-11 p-2 bg-muted text-muted-foreground rounded-full hover:bg-muted transition-all"
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
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="break-words text-2xl font-bold text-foreground sm:text-3xl">
                ระบบจัดการสถานที่และตารางเวลา
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Workforce Scheduling System
              </p>
              {/* 🌟 THE UX MAGIC: A subtle indicator that only shows during background fetches */}
              {isFetching && !isLoading && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" /* spinner svg */ />
                  กำลังอัปเดตข้อมูล...
                </span>
              )}
            </div>
            <Link
              href={`/organizations/${orgId}/work-schedule/new`}
              className="min-h-11 w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
            >
              + สร้างสถานที่ทำงานใหม่
            </Link>
          </div>
        </div>

        {/* 🟢 ส่วนแสดงรายชื่อสถานที่ทำงาน */}
        {workSchedulePlaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/50 px-5 py-8 text-center sm:px-10 sm:py-12">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl mb-4">
              📍
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              ยังไม่มีสถานที่ทำงานในระบบ
            </h3>
            <p className="text-muted-foreground max-w-md mb-6 text-sm leading-relaxed">
              {`เริ่มต้นจัดการตารางเวลาด้วยการสร้าง "สถานที่ทำงาน (Workplace)" เช่น
            แผนกผู้ป่วยนอก, คลินิกสาขา, หรือพื้นที่ที่ต้องการจัดเวร`}
            </p>
            <Link
              href={`/organizations/${orgId}/work-schedule/new`}
              className="min-h-11 w-full rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 sm:w-auto"
            >
              สร้างสถานที่ทำงานแห่งแรก
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workSchedulePlaces.map((place) => (
              <div
                key={place.id}
                className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 flex flex-col sm:p-6"
              >
                <h4 className="mb-1 break-words text-lg font-bold text-foreground">
                  {place.name}
                </h4>
                {/* <p className="text-xs text-muted-foreground font-mono mb-4">
                Timezone: {place.timezone}
              </p> */}
                <div className="mt-auto pt-4 border-t flex gap-2">
                  <Link
                    href={`/organizations/${orgId}/work-schedule/${place.id}/dashboard`}
                    className="min-h-11 w-full flex-1 rounded-lg bg-secondary px-4 py-2 text-center text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
                  >
                    จัดการตาราง
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DataStateWrapper>
  );
}
