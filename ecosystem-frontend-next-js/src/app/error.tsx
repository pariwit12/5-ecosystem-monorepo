// Next จะดึงไปโชว์อัตโนมัติ เวลาหน้า UI มีปัญหา โดย Next ดูจากชื่อไฟล์ (เค้าตั้งไว้แล้วว่าให้หา error.tsx)

"use client"; // ⚠️ สำคัญมาก: Error Boundary ต้องเป็น Client Component เท่านั้น

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 💡 ตรงนี้คือจุดที่ดีที่สุดในการยิง Log ไปเก็บที่เซิร์ฟเวอร์ (เช่น Sentry)
    console.error("🔥 เจอ UI Crash ในระบบ:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 sm:p-6 lg:p-8 text-center">
      <h2 className="text-2xl font-bold text-foreground mb-4">
        เกิดข้อผิดพลาดในการแสดงผลหน้าเว็บ
      </h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        ดูเหมือนว่าส่วนนี้ของระบบจะมีปัญหาบางอย่างในการประมวลผล
        เราได้ทำการบันทึกข้อมูลความผิดพลาดไว้แล้วครับ
      </p>

      {/* 🌟 ปุ่ม reset() คือท่าไม้ตายที่ Next.js ให้มา 
          มันจะสั่งให้ Component พยายาม Re-render ใหม่อีกครั้ง */}
      <Button className="min-h-11" onClick={() => reset()} variant="default">
        ลองใหม่อีกครั้ง
      </Button>
    </div>
  );
}
