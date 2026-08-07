import { useEffect } from "react";
import { useParams } from "next/navigation";

// ตรวจสอบว่าเป็น Error เป็นรูปแบบ Error จาก Axios หรือไม่
import { isAxiosError } from "axios";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

import { toast } from "sonner";

export const useEffectCheckError = (
  errorQuery: unknown,
  errorCodeRedirectList: Record<string, string>,
  dataQuery: unknown,
) => {
  const params = useParams(); // ดึงค่า params ปัจจุบัน เช่น { placeId: '123' }

  // ===========================================================================
  // คำนวณสถานะการ Redirect แบบ Synchronous (เพื่อให้คืนค่ากลับไปบล็อก UI ได้ทันที)
  // ===========================================================================

  let isRedirecting = false;
  let errorCode: ErrorCode | undefined = undefined;
  let finalTargetUrl: string | undefined = undefined;

  if (errorQuery && isAxiosError(errorQuery)) {
    errorCode = errorQuery.response?.data?.errorCode;

    if (errorCode && errorCodeRedirectList[errorCode]) {
      let targetUrl = errorCodeRedirectList[errorCode];

      // 1. แทนที่ตัวแปรแบบ [placeId] ด้วยค่าจริงจาก URL
      Object.keys(params).forEach((key) => {
        targetUrl = targetUrl.replace(`[${key}]`, String(params[key]));
      });

      // 2. เช็คว่า URL เดิมมีเครื่องหมาย ? อยู่แล้วหรือไม่
      // ถ้ามีให้ใช้ & เชื่อมต่อ แต่ถ้ายังไม่มีให้ใช้ ?
      const separator = targetUrl.includes("?") ? "&" : "?";

      // นำ errorCode ไปต่อท้าย
      finalTargetUrl = `${targetUrl}${separator}error=${errorCode}`;

      isRedirecting = true;
    }
  }

  // ===========================================================================
  // (จบ) คำนวณสถานะการ Redirect แบบ Synchronous (เพื่อให้คืนค่ากลับไปบล็อก UI ได้ทันที)
  // ===========================================================================

  useEffect(() => {
    //
    // =====================================================
    // ตรวจสอบ error จากการ fetching หรือไม่ ให้เด้งแจ้งเตือน
    // =====================================================

    if (isRedirecting === false && errorQuery && dataQuery !== undefined) {
      toast.error(
        "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
      );
    }

    // =====================================================
    // (จบ) ตรวจสอบ error จากการ fetching หรือไม่ ให้เด้งแจ้งเตือน
    // =====================================================
    //
  }, [isRedirecting, errorQuery, dataQuery]);

  return {
    isRedirecting,
    targetUrl: finalTargetUrl,
    errorCode: errorCode,
  };
};
