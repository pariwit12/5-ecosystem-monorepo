"use client";

export default function ErrorQuery({
  //
  // เราเขียน throw error จากใน page.tsx -> Next.js จะจัดการใส่ error กับ reset มาให้โดยอัตโนมัติ
  // error,
  reset,
}: {
  error?: Error;
  reset: () => void;
}) {
  return (
    //
    // ปรับตามใช้งานจริง
    <div className="flex flex-col items-center justify-center p-8 min-h-[50vh] gap-4">
      <h2 className="text-red-500 animate-pulse">
        เกิดข้อผิดพลาดในการโหลดข้อมูล (error.tsx)
      </h2>
      <button
        onClick={() => reset()}
        className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all flex items-center gap-2 shadow-sm border border-gray-200"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        ลองโหลดใหม่อีกครั้ง
      </button>
    </div>
  );
}
