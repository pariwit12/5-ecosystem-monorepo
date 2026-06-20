// สร้าง [...variable]/page.tsx เพื่อรับ invalid URL ใช้แทนการ redirect ไป not-found.tsx แก้ปัญหาเรื่อง Clerk fail
// วันที่ 20/6/2026 - Clerk SDK มีปัญหากับ not-found.tsx แล้ว back กลับมา (ไม่ยอม re-connect)

"use client"; // 🌟 1. ต้องเติมสิ่งนี้เพราะเราจะใช้ useRouter() มาสร้าง router.back

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  // 🌟 2. เรียกใช้งาน router
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      {/* ไอคอนและพื้นหลังวงกลม */}
      <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-12 h-12" />
      </div>

      {/* ข้อความแจ้งเตือน */}
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        404 - ไม่พบหน้าเว็บนี้ (This is [...notFound]/page.tsx)
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        ขออภัยครับ เราไม่พบเนื้อหาที่คุณกำลังค้นหา ลิงก์อาจเสียหาย
        หรือหน้านี้อาจถูกลบไปแล้ว
      </p>

      {/* 🌟 3. จัดกลุ่มปุ่มให้อยู่คู่กัน (Flex row) */}
      <div className="flex items-center gap-4">
        {/* ปุ่มย้อนกลับ */}
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors shadow-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>

        {/* ปุ่มพากลับไป Home */}
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          กลับไปหน้าแรก
        </Link>
      </div>
    </div>
  );
}
