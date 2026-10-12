import { Skeleton } from "@/components/ui/skeleton";

// สร้างจากโครงของหน้าจอแสดงผลจริง
// ปรับตามใช้งานจริง
export default function TemplateLoading() {
  return (
    // 🌟 รักษาโครงสร้าง p-8 max-w-6xl gap-8 เหมือนหน้า page.tsx เป๊ะๆ!
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8 relative">
      {/* 1. จำลองส่วนหัวข้อ */}
      <div className="w-full space-y-2">
        <Skeleton className="h-9 w-50" /> {/* แท่งหัวข้อใหญ่ */}
        <Skeleton className="h-5 w-95" /> {/* แท่งคำอธิบาย */}
      </div>

      {/* 2. จำลอง Grid การ์ด (เลียนแบบหน้าจริงที่แบ่งเป็น 3 คอลัมน์) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* วนลูปวาดการ์ด Skeleton เปล่าๆ ขึ้นมา 3 ใบขัดตาทัพ */}
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col items-start min-h-48.5"
          >
            {/* จำลองโลโก้วงกลม/สี่เหลี่ยมมนมุมการ์ด */}
            <Skeleton className="w-12 h-12 rounded-xl mb-4" />

            {/* จำลองชื่อองค์กร (ใช้ w-3/4 ให้เหมือนตัวหนังสือยาวไม่เท่ากันจริง) */}
            <Skeleton className="h-6 w-3/4 mb-2" />

            {/* จำลองรหัส ID */}
            <Skeleton className="h-4 w-1/2 mb-6" />

            {/* จำลองปุ่มกดด้านล่างการ์ด */}
            <Skeleton className="h-10 w-full rounded-lg mt-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
