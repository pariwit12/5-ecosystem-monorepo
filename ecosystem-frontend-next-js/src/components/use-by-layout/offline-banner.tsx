"use client";

import { useNetwork } from "@/hooks/use-network"; // อัปเดต path ให้ตรงกับโปรเจกต์
import { WifiOff } from "lucide-react"; // ใช้ Icon จาก lucide-react ที่ติดมากับ shadcn

export function OfflineBanner() {
  const isOnline = useNetwork();

  // ถ้าเน็ตมาปกติ ก็ไม่ต้องเรนเดอร์อะไรออกมาเลย
  if (isOnline) return null;

  // ถ้าเน็ตหลุด ให้โชว์แถบสีเหลือง/ส้ม แจ้งเตือน
  return (
    <div className="sticky top-0 z-50 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-amber-500 px-3 py-2 text-center text-sm font-medium text-primary-foreground shadow-sm animate-in slide-in-from-top sm:px-4">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span className="min-w-0">
        คุณกำลังออฟไลน์ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ
        การเปลี่ยนแปลงอาจไม่ถูกบันทึก
      </span>
    </div>
  );
}
