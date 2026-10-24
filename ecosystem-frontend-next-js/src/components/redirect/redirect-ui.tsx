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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8 bg-card rounded-lg shadow-md text-center max-w-sm">
        <h2 className="text-xl text-destructive font-bold mb-2">ข้อผิดพลาด</h2>
        {/* 🌟 แสดงข้อความที่ดึงมาได้ */}
        <p className="mb-6 text-muted-foreground">{errorMessage}</p>
        <p className="mb-6 text-muted-foreground">
          ระบบกำลังพาไปยังหน้าต่างที่เหมาะสม...
        </p>
        <button
          onClick={() => router.push(targetUrl)}
          className="min-h-11 w-full rounded bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
        >
          ดำเนินการต่อ
        </button>
      </div>
    </div>
  );
}
