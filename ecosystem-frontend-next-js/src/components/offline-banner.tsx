"use client";

import { useNetwork } from "@/hooks/use-network"; // อัปเดต path ให้ตรงกับโปรเจกต์
import { WifiOff } from "lucide-react"; // ใช้ Icon จาก lucide-react ที่ติดมากับ shadcn

export function OfflineBanner() {
  const isOnline = useNetwork();

  // ถ้าเน็ตมาปกติ ก็ไม่ต้องเรนเดอร์อะไรออกมาเลย
  if (isOnline) return null;

  // ถ้าเน็ตหลุด ให้โชว์แถบสีเหลือง/ส้ม แจ้งเตือน
  return (
    <div className="w-full bg-amber-500 text-white text-sm font-medium py-2 px-4 flex items-center justify-center gap-2 z-50 sticky top-0 shadow-md animate-in slide-in-from-top">
      <WifiOff className="w-4 h-4" />
      <span>
        คุณกำลังออฟไลน์ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ
        การเปลี่ยนแปลงอาจไม่ถูกบันทึก
      </span>
    </div>
  );
}
