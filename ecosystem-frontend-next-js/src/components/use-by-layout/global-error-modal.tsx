"use client";

import { useErrorStore } from "@/store/use-error-store";
// หากใช้ไอคอน แนะนำให้ import จาก lucide-react หรือ heroicons ครับ
// import { AlertTriangle } from 'lucide-react';

export default function GlobalErrorModal() {
  const { isOpen, title, message, statusCode, errorCode, clearError } =
    useErrorStore();

  // ถ้าไม่มี Error ก็ไม่ต้องเรนเดอร์อะไรเลย
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header แถบสีแดง */}
        <div className="bg-destructive/10 p-6 flex flex-col items-center text-center border-b border-destructive">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            {/* <AlertTriangle className="w-8 h-8 text-destructive" /> */}
            <span className="text-3xl">⚠️</span>
          </div>
          {statusCode ? (
            <h2 className="text-xl font-bold text-destructive">
              {title} ({statusCode})
            </h2>
          ) : (
            <h2 className="text-xl font-bold text-destructive">{title}</h2>
          )}
          {errorCode && (
            <span className="mt-2 inline-block px-2 py-1 bg-destructive/10 text-destructive text-xs font-semibold rounded-full">
              Error: {errorCode}
            </span>
          )}
        </div>

        {/* Body เนื้อหา Error */}
        <div className="p-6 text-center text-muted-foreground">
          <p>{message}</p>
        </div>

        {/* Footer ปุ่มกดปิด */}
        <div className="flex justify-center border-t border-border bg-muted p-4">
          <button
            onClick={clearError}
            className="min-h-11 rounded-lg bg-secondary px-6 py-2 font-medium text-secondary-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            รับทราบและปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
