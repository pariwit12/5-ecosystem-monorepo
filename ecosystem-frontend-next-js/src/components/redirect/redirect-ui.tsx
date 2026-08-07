"use client";

import { useRouter } from "next/navigation";
import { API_ERROR_MESSAGES } from "@/constants/error-messages";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

interface RedirectUIProps {
  targetUrl: string;
  errorCode: ErrorCode;
}

export default function RedirectUI({ targetUrl, errorCode }: RedirectUIProps) {
  const router = useRouter();

  // 🌟 ดึงข้อความจากไฟล์ constants ถ้าไม่พบให้ใช้ข้อความ Default
  const errorMessage = API_ERROR_MESSAGES[errorCode] || "เกิดข้อผิดพลาด";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-sm">
        <h2 className="text-xl text-red-600 font-bold mb-2">ข้อผิดพลาด</h2>
        {/* 🌟 แสดงข้อความที่ดึงมาได้ */}
        <p className="mb-6 text-gray-600">{errorMessage}</p>
        <p className="mb-6 text-gray-600">
          ระบบกำลังพาไปยังหน้าต่างที่เหมาะสม...
        </p>
        <button
          onClick={() => router.push(targetUrl)}
          className="px-4 py-2 w-full bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          ดำเนินการต่อ
        </button>
      </div>
    </div>
  );
}
