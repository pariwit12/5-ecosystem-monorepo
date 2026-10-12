// สามารถใช้เป็น client ได้ หากมีปุ่มหรือว่าต้องการสร้างอะไรที่ซับซ้อน แต่ประสิทธิภาพจะไม่เท่า server component
// "use client";

export default function Loading() {
  return (
    //
    // ปรับตามใช้งานจริง (คง Default หรือ ทำ Skeleton หรือ ปรับแต่งใหม่)
    <div className="flex flex-col items-center justify-center p-8 min-h-[50vh] gap-4">
      <div className="text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</div>

      {/* ต้องใช้ use client */}
      {/* <button
        onClick={() => window.location.reload()}
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
        โหลดหน้าเว็บใหม่อีกครั้ง
      </button> */}
    </div>
  );
}
