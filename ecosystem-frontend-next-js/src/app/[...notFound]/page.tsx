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
      <div className="w-24 h-24 bg-muted text-muted-foreground rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-12 h-12" />
      </div>

      {/* ข้อความแจ้งเตือน */}
      <h2 className="break-words text-2xl font-bold text-foreground sm:text-3xl mb-2">
        404 - ไม่พบหน้าเว็บนี้ (This is [...notFound]/page.tsx)
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        ขออภัยครับ เราไม่พบเนื้อหาที่คุณกำลังค้นหา ลิงก์อาจเสียหาย
        หรือหน้านี้อาจถูกลบไปแล้ว
      </p>

      {/* 🌟 3. จัดกลุ่มปุ่มให้อยู่คู่กัน (Flex row) */}
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
        {/* ปุ่มย้อนกลับ */}
        <button
          onClick={() => router.back()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-accent sm:w-auto sm:px-6"
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>

        {/* ปุ่มพากลับไป Home */}
        <Link
          href="/"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:w-auto sm:px-6"
        >
          <Home className="w-4 h-4" />
          กลับไปหน้าแรก
        </Link>
      </div>
    </div>
  );
}
