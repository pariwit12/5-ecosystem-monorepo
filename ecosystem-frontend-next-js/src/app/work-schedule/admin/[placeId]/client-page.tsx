"use client";

import Link from "next/link";

export default function Client({ placeId }: { placeId: string }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <header className="flex items-start gap-3 border-b pb-6 sm:items-center sm:gap-5 sm:pb-8">
        <Link
          href="/work-schedule"
          aria-label="กลับไปหน้าเลือกสถานที่ทำงาน"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:size-11"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-sm">Workforce Scheduling</p>
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Admin Mode</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            แผงควบคุมผู้ดูแล
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            จัดการตารางเวลาและบุคลากรในสถานที่ทำงานนี้
          </p>
        </div>
      </header>

      <section aria-labelledby="admin-menu-heading">
        <div className="mb-5">
          <h2 id="admin-menu-heading" className="text-lg font-semibold text-foreground sm:text-xl">
            เลือกเมนูที่ต้องการจัดการ
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">เลือกส่วนที่ต้องการเข้าถึงจากเมนูด้านล่าง</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <Link
            href={`/work-schedule/admin/${placeId}/position`}
            className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-7"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-primary transition-all group-hover:h-1.5" />
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/90 group-hover:text-primary-foreground sm:size-14">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-card-foreground transition-colors group-hover:text-primary sm:text-xl">
                  จัดการตารางเวร
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  สร้างกะการทำงาน (Slots), อนุมัติการจองเวร,
                  และตรวจสอบตารางเวลาของพนักงานทั้งหมดในสถานที่นี้
                </p>
              </div>
            </div>
            <div className="mt-7 flex items-center justify-between gap-3 border-t pt-4 text-sm font-semibold text-primary">
              <span>เปิดตำแหน่งงานและตารางเวร</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </Link>

          <Link
            href={`/work-schedule/admin/${placeId}/staff`}
            className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-7"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-primary transition-all group-hover:h-1.5" />
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/90 group-hover:text-primary-foreground sm:size-14">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-card-foreground transition-colors group-hover:text-primary sm:text-xl">
                  จัดการพนักงาน
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  เพิ่ม/ลบรายชื่อพนักงาน, จัดการตำแหน่ง (Positions)
                  และตั้งค่าสิทธิ์การเข้าถึงของบุคลากร
                </p>
              </div>
            </div>
            <div className="mt-7 flex items-center justify-between gap-3 border-t pt-4 text-sm font-semibold text-primary">
              <span>เปิดรายชื่อพนักงาน</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
