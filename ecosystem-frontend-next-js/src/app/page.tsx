"use client";

import { Show } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col items-center gap-10">
      {/* 🔴 โซนที่ 1: สถานะยังไม่ได้ล็อกอิน */}
      <Show when="signed-out">
        <div className="mt-20 p-8 border rounded-2xl shadow-sm bg-white w-full max-w-md text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Pariwit Ecosystem
          </h2>
          <p className="text-gray-500 mb-8 text-sm">
            เข้าสู่ระบบเพื่อเข้าถึงแอปพลิเคชันทั้งหมด
          </p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-500 text-sm">
            👆 กรุณากดปุ่ม Sign In ที่มุมขวาบน
          </div>
        </div>
      </Show>

      {/* 🟢 โซนที่ 2: สถานะล็อกอินแล้ว (App Portal) */}
      <Show when="signed-in">
        {/* หัวข้อ Portal */}
        <div className="w-full max-w-5xl text-center mt-8">
          <h2 className="text-3xl font-bold text-gray-800">
            แอปพลิเคชันของคุณ
          </h2>
          <p className="text-gray-500 mt-2">
            เลือกโปรแกรมที่คุณต้องการใช้งานจาก Ecosystem
          </p>
        </div>

        {/* ตะแกรง Grid โชว์โปรแกรม 3 ตัว */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* โปรแกรมที่ 1: Toothcraft */}
          {/* ชั่วคราว: พาไปที่หน้า organizations ก่อน เพราะปกติต้องเลือกร้านก่อนเข้าแอป */}
          {/* <Link
            // ปรับตามใช้งานจริง
            href="/organizations"
            className="p-6 border rounded-2xl shadow-sm bg-white hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform font-bold text-3xl">
              🦷
            </div>
            <h3 className="text-lg font-bold text-gray-800">Toothcraft</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              ระบบบริหารจัดการคลินิกทันตกรรมครบวงจร
            </p>
            <button className="mt-auto px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg w-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
              เปิดใช้งาน
            </button>
          </Link> */}

          {/* 🌟 โปรแกรมที่ 2: Work Schedule System (ของจริง!) */}
          <Link
            href="/work-schedule"
            className="p-6 border border-purple-100 rounded-2xl shadow-sm bg-white hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* ป้ายกำกับ New */}
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
              ใหม่
            </div>
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform font-bold text-3xl">
              🗓️
            </div>
            <h3 className="text-lg font-bold text-gray-800">Work Schedule</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              ระบบบริหารตารางการทำงานและจัดการกะ
            </p>
            <button className="mt-auto px-4 py-2 bg-purple-50 text-purple-600 font-medium rounded-lg w-full group-hover:bg-purple-600 group-hover:text-white transition-colors">
              เข้าสู่ระบบจัดเวร
            </button>
          </Link>

          {/* โปรแกรมที่ 3: Coming Soon */}
          <div className="p-6 border border-dashed border-gray-300 rounded-2xl bg-gray-50 flex flex-col items-center text-center opacity-70">
            <div className="w-16 h-16 bg-gray-200 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
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
            <h3 className="text-lg font-bold text-gray-600">Coming Soon</h3>
            <p className="text-sm text-gray-400 mt-2 mb-6">
              แอปพลิเคชันใหม่กำลังอยู่ในช่วงพัฒนา
            </p>
            <button
              disabled
              className="mt-auto px-4 py-2 bg-gray-200 text-gray-500 font-medium rounded-lg w-full cursor-not-allowed"
            >
              เร็วๆ นี้
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
