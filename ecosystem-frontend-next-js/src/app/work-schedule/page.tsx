"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { workScheduleLogInQueries } from "@/features/work-schedule/log-in/work-schedule-log-in.queries";
import { DataStateWrapper } from "@/components/data-state-wrapper";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export default function Page() {
  const router = useRouter();
  const { getToken, userId, isLoaded } = useAuth();

  const { data, isLoading, isFetching, error } = useQuery(
    workScheduleLogInQueries.userRolesByClerkId(userId, getToken, [
      ErrorCode.PERSON_NOT_FOUND,
    ]),
  );

  useEffect(() => {
    if (error && isAxiosError(error)) {
      const errorCode = error.response?.data?.errorCode;

      if ([ErrorCode.PERSON_NOT_FOUND].includes(errorCode)) {
        router.push(`/person/new?error=${errorCode}`);
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
    [ErrorCode.PERSON_NOT_FOUND].includes(error.response?.data?.errorCode)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">
        เกิดข้อผิดพลาด กำลังพากลับไปยังหน้าที่เหมาะสม...
      </div>
    );
  }

  const placesAsAdmin = data?.placesAsAdmin || [];
  const placesAsStaff = data?.placesAsStaff || [];

  return (
    <DataStateWrapper
      isAuthLoaded={isLoaded}
      isQueryLoading={isLoading}
      errorQuery={error}
    >
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="flex flex-col items-stretch gap-3 border-b pb-6 sm:flex-row sm:items-center sm:gap-5 sm:pb-8">
          <Link
            href="/"
            aria-label="กลับหน้าหลัก"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:size-11"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-sm">
              Workforce Scheduling
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              ระบบจัดการสถานที่และตารางเวลา
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              เลือกสถานที่ทำงานเพื่อจัดการตารางเวร หรือดูข้อมูลในบทบาทของคุณ
            </p>
            {isFetching && !isLoading && (
              <span
                role="status"
                className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground"
              >
                <svg
                  className="size-4 animate-spin"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
            )}
          </div>
          <div className="flex w-full shrink-0 items-center gap-3 sm:w-auto">
            <Link
              href="/work-schedule/invitations"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-center text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary/20 sm:w-auto"
            >
              <span>📩</span> กรอกโค้ด / สถานะคำขอ
            </Link>
          </div>
        </header>

        {placesAsAdmin.length === 0 && placesAsStaff.length === 0 ? (
          <section className="flex flex-col items-center rounded-2xl border border-dashed bg-muted/30 px-5 py-12 text-center sm:px-10 sm:py-16">
            <div
              className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl"
              aria-hidden="true"
            >
              📍
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              ยังไม่มีสถานที่ทำงานในระบบ
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              เมื่อคุณได้รับสิทธิ์ในสถานที่ทำงาน หรือกรอกรหัสคำเชิญ สถานที่นั้นจะแสดงที่นี่เพื่อให้คุณเข้าถึงเมนูที่เกี่ยวข้องได้
            </p>
          </section>
        ) : (
          <div
            className={`flex flex-col gap-9 transition-opacity duration-200 ${
              isFetching && !isLoading ? "opacity-60" : "opacity-100"
            }`}
          >
            {placesAsAdmin.length > 0 && (
              <section aria-labelledby="admin-places-heading">
                <div className="mb-4 flex flex-col gap-1 sm:mb-5">
                  <h2
                    id="admin-places-heading"
                    className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl"
                  >
                    <span aria-hidden="true">👑</span> สถานที่ที่คุณดูแล
                  </h2>
                  <p className="text-sm text-muted-foreground">Places you manage</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {placesAsAdmin.map((place) => (
                    <article
                      key={place.id}
                      className="flex min-w-0 flex-col rounded-2xl border border-primary/20 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md sm:p-6"
                    >
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          Admin
                        </span>
                        <span className="text-xs text-muted-foreground">สถานที่ทำงาน</span>
                      </div>
                      <h3 className="break-words text-lg font-semibold leading-snug text-card-foreground">
                        {place.name}
                      </h3>
                      <div className="mt-6 border-t pt-4">
                        <Link
                          href={`/work-schedule/admin/${place.id}`}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          จัดการตารางเวร <span className="ml-2" aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {placesAsStaff.length > 0 && (
              <section aria-labelledby="staff-places-heading">
                <div className="mb-4 flex flex-col gap-1 sm:mb-5">
                  <h2
                    id="staff-places-heading"
                    className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl"
                  >
                    <span aria-hidden="true">🩺</span> สถานที่ทำงานของคุณ
                  </h2>
                  <p className="text-sm text-muted-foreground">Your workplaces</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {placesAsStaff.map((place) => (
                    <article
                      key={place.id}
                      className="flex min-w-0 flex-col rounded-2xl border border-primary/20 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md sm:p-6"
                    >
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          Staff
                        </span>
                        <span className="text-xs text-muted-foreground">สถานที่ทำงาน</span>
                      </div>
                      <h3 className="break-words text-lg font-semibold leading-snug text-card-foreground">
                        {place.name}
                      </h3>
                      <div className="mt-6 border-t pt-4">
                        <Link
                          href={`/work-schedule/staff/${place.id}`}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-center text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          เข้าสู่สถานที่ทำงาน <span className="ml-2" aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </DataStateWrapper>
  );
}
