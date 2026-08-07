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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header แถบสีแดง */}
        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            {/* <AlertTriangle className="w-8 h-8 text-red-600" /> */}
            <span className="text-3xl">⚠️</span>
          </div>
          {statusCode ? (
            <h2 className="text-xl font-bold text-red-900">
              {title} ({statusCode})
            </h2>
          ) : (
            <h2 className="text-xl font-bold text-red-900">{title}</h2>
          )}
          {errorCode && (
            <span className="mt-2 inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
              Error: {errorCode}
            </span>
          )}
        </div>

        {/* Body เนื้อหา Error */}
        <div className="p-6 text-center text-gray-600">
          <p>{message}</p>
        </div>

        {/* Footer ปุ่มกดปิด */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
          <button
            onClick={clearError}
            className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            รับทราบและปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
