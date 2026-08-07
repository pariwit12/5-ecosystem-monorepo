"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

// ===========================
// นำเข้า Message และ List
// ===========================

import { API_ERROR_MESSAGES } from "@/constants/error-messages";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

import { PAGE_ERROR_MESSAGES } from "@/constants/error-messages";
import { PageErrorList } from "@/constants/page-error-list.enum";

// ===========================
// (จบ) นำเข้า Message และ List
// ===========================

// ==========================================
// 🛡️ Component ดักจับ Error จาก URL (Global)
// ==========================================

export default function ToastNotifier() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. ดักจับตัวแปร error จาก URL
    const errorCode = searchParams.get("error");

    if (!errorCode) return;

    // 2. แสดง Toast แจ้งเตือน
    const pageErrorMessage = PAGE_ERROR_MESSAGES[errorCode as PageErrorList];
    const apiErrorMessage = API_ERROR_MESSAGES[errorCode as ErrorCode];

    if (pageErrorMessage) {
      toast.error("รูปแบบ URL ไม่ถูกต้อง", {
        description: pageErrorMessage,
      });
    } else if (apiErrorMessage) {
      toast.error("ไม่สามารถเข้าถึงข้อมูลได้", {
        description: apiErrorMessage,
      });
    } else {
      // Fallback ป้องกันกรณีส่ง Error Code ที่ไม่ได้ลงทะเบียนไว้มา (กันเหนียว)
      toast.error("เกิดข้อผิดพลาดที่ไม่ได้ลงทะเบียนไว้", {
        description: `รหัสข้อผิดพลาด: ${errorCode}`,
      });
    }

    // 3. ลบ ?error=... ออกอย่างปลอดภัย (โดยรักษาส่วนอื่นๆ ของ URL ไว้)
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("error"); // สั่งลบแค่ error ตัวเดียว

    window.history.replaceState(
      null,
      "",
      newUrl.toString(), // URL ที่จะแทนที่
    );
  }, [searchParams]);

  return null;
}

// วิธีการใช้งาน window.location

// สมมติว่า URL เต็มๆ บนหน้าจอของผู้ใช้ตอนนี้คือ: https://www.yourdomain.com/template/123?error=invalid_id
// window.location.origin   จะได้ค่าเป็น https://www.yourdomain.com (ส่วนโดเมนหลัก)
// window.location.pathname จะได้ค่าเป็น /template/123 (ส่วนเส้นทางหน้าเว็บ) 👈 พระเอกของเราอยู่ตรงนี้ครับ!
// window.location.search   จะได้ค่าเป็น ?error=invalid_id (ส่วน Query Parameters ทั้งหมด)
// window.location.hash     จะได้ค่าเป็น #section1 (ถ้ามีการกระโดดไปตามจุดต่างๆ ของหน้า)
