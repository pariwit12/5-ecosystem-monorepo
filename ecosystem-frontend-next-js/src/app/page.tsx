"use client";

import { Show } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full max-w-6xl min-w-0 p-4 sm:mx-auto sm:p-6 lg:p-8 flex flex-col items-center gap-8 sm:gap-10">
      {/* 🔴 โซนที่ 1: สถานะยังไม่ได้ล็อกอิน */}
      <Show when="signed-out">
        <div className="mt-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 text-center shadow-sm sm:mt-20 sm:p-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Pariwit Ecosystem
          </h2>
          <p className="text-muted-foreground mb-8 text-sm">
            เข้าสู่ระบบเพื่อเข้าถึงแอปพลิเคชันทั้งหมด
          </p>
          <div className="p-4 bg-background rounded-xl border border-border text-muted-foreground text-sm">
            👆 กรุณากดปุ่ม Sign In ที่มุมขวาบน
          </div>
        </div>
      </Show>

      {/* 🟢 โซนที่ 2: สถานะล็อกอินแล้ว (App Portal) */}
      <Show when="signed-in">
        {/* หัวข้อ Portal */}
        <div className="w-full max-w-5xl text-center mt-8">
          <h2 className="break-words text-2xl font-bold text-foreground sm:text-3xl">
            แอปพลิเคชันของคุณ
          </h2>
          <p className="text-muted-foreground mt-2">
            เลือกโปรแกรมที่คุณต้องการใช้งานจาก Ecosystem
          </p>
        </div>

        {/* ตะแกรง Grid โชว์โปรแกรม 3 ตัว */}
        <div className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {/* โปรแกรมที่ 1: Toothcraft */}
          {/* ชั่วคราว: พาไปที่หน้า organizations ก่อน เพราะปกติต้องเลือกร้านก่อนเข้าแอป */}
          {/* <Link
            // ปรับตามใช้งานจริง
            href="/organizations"
            className="p-6 border rounded-2xl shadow-sm bg-card hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform font-bold text-3xl">
              🦷
            </div>
            <h3 className="text-lg font-bold text-foreground">Toothcraft</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              ระบบบริหารจัดการคลินิกทันตกรรมครบวงจร
            </p>
            <button className="mt-auto min-h-11 w-full rounded-lg bg-primary/10 px-4 py-2 font-medium text-primary transition-colors group-hover:bg-primary/90 group-hover:text-primary-foreground">
              เปิดใช้งาน
            </button>
          </Link> */}

          {/* 🌟 โปรแกรมที่ 2: Work Schedule System (ของจริง!) */}
          <Link
            href="/work-schedule"
            className="p-6 border border-primary/20 rounded-2xl shadow-sm bg-card hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* ป้ายกำกับ New */}
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
              ใหม่
            </div>
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform font-bold text-3xl">
              🗓️
            </div>
            <h3 className="text-lg font-bold text-foreground">Work Schedule</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              ระบบบริหารตารางการทำงานและจัดการกะ
            </p>
            <button className="mt-auto min-h-11 w-full rounded-lg bg-primary/10 px-4 py-2 font-medium text-primary transition-colors group-hover:bg-primary/90 group-hover:text-primary-foreground">
              เข้าสู่ระบบจัดเวร
            </button>
          </Link>

          {/* โปรแกรมที่ 3: Coming Soon */}
          <div className="p-6 border border-dashed border-border rounded-2xl bg-background flex flex-col items-center text-center opacity-70">
            <div className="w-16 h-16 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-muted-foreground">Coming Soon</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              แอปพลิเคชันใหม่กำลังอยู่ในช่วงพัฒนา
            </p>
            <button
              disabled
              className="mt-auto min-h-11 w-full rounded-lg bg-muted px-4 py-2 font-medium text-muted-foreground cursor-not-allowed"
            >
              เร็วๆ นี้
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
