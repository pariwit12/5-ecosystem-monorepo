"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { organizationsQueries } from "@/features/organizations/hooks/organizations.queries";

import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

import { useEffect } from "react"; // 🌟 1. นำเข้า useEffect
import { useRouter } from "next/navigation"; // 🌟 1. นำเข้า useRouter
import { isAxiosError } from "axios"; // 🌟 1. นำเข้า isAxiosError เพื่อความปลอดภัยของ TypeScript

import Link from "next/link";

// 🌟 รับ orgId ที่ผ่านการสแกนแล้วมาจาก Server Component
export default function OrganizationSettingsClient({
  orgId,
}: {
  orgId: string;
}) {
  const { getToken, userId, isLoaded } = useAuth();
  const {
    data: orgDetails,
    isLoading,
    error,
  } = useQuery(
    organizationsQueries.detail(userId, orgId, getToken, [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
    ]),
  );

  const router = useRouter();

  // 🌟 3. ด่านดักจับ Error แล้ว Redirect
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

  // isLoaded คือ จาก useAuth (Clerk) ป้องกันจังหวะแรกที่ยังโหลด userId ไม่เสร็จ
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        กำลังโหลดข้อมูลองค์กร...
      </div>
    );
  }

  // 🌟 4. ป้องกันหน้าจอกระพริบ (UI Flash):
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
      {/* 🟢 ส่วนหัวข้อ และปุ่มย้อนกลับ */}
      <div className="flex flex-wrap items-start gap-3 border-b pb-6 sm:items-center sm:gap-4">
        <Link
          href="/organizations"
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

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-bold text-foreground sm:text-3xl">
              ตั้งค่าองค์กร: {orgDetails?.name}
            </h2>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground sm:text-sm">
              Organization ID: {orgDetails?.id}
            </p>
          </div>

          {/* 🌟 ปุ่มลิงก์ไปหน้า General Settings */}
          <Link
            href={`/organizations/${orgId}/settings/general`}
            className="min-h-11 w-full rounded-lg bg-secondary px-4 py-2 text-center text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent sm:w-auto"
          >
            แก้ไขข้อมูลทั่วไป
          </Link>
        </div>
      </div>

      {/* 🟢 โซนจัดการโมดูล (Subscriptions) */}
      <div>
        <h3 className="text-xl font-bold text-foreground mb-4">
          โมดูลและแอปพลิเคชัน (Subscriptions)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* การ์ดแอป Toothcraft */}
          <div className="border border-primary/20 bg-card rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
              แนะนำ
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-2xl">
                🦷
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  Dental Clinic Information System
                </h4>
                <p className="text-sm text-muted-foreground">
                  ระบบบริหารจัดการคลินิกทันตกรรม
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-6 flex-1">
              จัดการประวัติคนไข้ ตารางนัดหมาย ทันตแพทย์ และระบบคลังสต๊อกวัสดุ
            </p>
            <div className="flex flex-col items-start gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                สถานะ:{" "}
                <span className="text-primary font-bold">พร้อมใช้งาน</span>
              </span>
              <Link
                href={`/organizations/${orgId}/dental-clinic`}
                className="min-h-11 w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
              >
                เข้าสู่ระบบจัดการคลินิก
              </Link>
            </div>
          </div>

          {/* 🌟 การ์ดแอป Work Schedule (ใหม่) */}
          <div className="border border-primary/20 bg-card rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden transition-all hover:border-primary/20 hover:shadow-md">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
              ใหม่
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-2xl">
                🗓️
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  Work Schedule System
                </h4>
                <p className="text-sm text-muted-foreground">ระบบบริหารตารางการทำงาน</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-6 flex-1">
              จัดการกะทำงาน สร้างแม่แบบเวร
              และให้พนักงานกดจองคิวลงเวลาทำงานได้แบบยืดหยุ่น
            </p>
            <div className="flex flex-col items-start gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                สถานะ:{" "}
                <span className="text-primary font-bold">พร้อมใช้งาน</span>
              </span>
              <Link
                href={`/organizations/${orgId}/work-schedule`}
                className="min-h-11 w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto"
              >
                เข้าสู่ระบบจัดเวร
              </Link>
            </div>
          </div>

          {/* การ์ดแอป HR (ตัวอย่างแอปในอนาคต) */}
          <div className="border border-border bg-card rounded-2xl p-6 shadow-sm flex flex-col opacity-75 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold text-2xl">
                👥
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  HR & Payroll
                </h4>
                <p className="text-sm text-muted-foreground">
                  ระบบจัดการบุคคลและเงินเดือน
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-6 flex-1">
              คำนวณเงินเดือนหมอ หักภาษี และจัดการวันลาของพนักงานในคลินิก
            </p>
            <div className="flex flex-col items-start gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                เร็วๆ นี้
              </span>
              <button
                disabled
                className="min-h-11 w-full rounded-lg bg-muted px-4 py-2 text-center font-medium text-muted-foreground cursor-not-allowed sm:w-auto"
              >
                ยังไม่เปิดให้บริการ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 โซนจัดการพนักงาน (รอลุยในอนาคต) */}
      <div className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-foreground">สมาชิกในองค์กร</h3>
          <button className="min-h-11 w-full rounded-lg bg-secondary px-4 py-2 font-medium text-secondary-foreground transition-colors hover:bg-accent sm:w-auto">
            + เชิญสมาชิก
          </button>
        </div>
        <div className="bg-card border rounded-2xl p-4 sm:p-6 lg:p-8 text-center text-muted-foreground shadow-sm">
          ฟีเจอร์จัดการพนักงานและกำหนด Role จะแสดงที่นี่
        </div>
      </div>
    </div>
  );
}
