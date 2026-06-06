// Next จะดึงไปโชว์อัตโนมัติ แทน _not-found ตัว default ที่มีมากับโปรเจกต์อยู่แล้ว

import Link from "next/link";
import { FileQuestion } from "lucide-react"; // ใช้ไอคอนจาก lucide-react

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      {/* ไอคอนและพื้นหลังวงกลม */}
      <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-12 h-12" />
      </div>

      {/* ข้อความแจ้งเตือน */}
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        404 - ไม่พบหน้าเว็บนี้
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        ขออภัยครับ เราไม่พบเนื้อหาที่คุณกำลังค้นหา ลิงก์อาจเสียหาย
        หรือหน้านี้อาจถูกลบไปแล้ว
      </p>

      {/* ปุ่มพากลับไปตั้งหลัก */}
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
      >
        กลับไปหน้าแรก
      </Link>
    </div>
  );
}
