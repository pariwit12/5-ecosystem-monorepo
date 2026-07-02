//
// 🌟 หน้าบ้านรับหน้าที่แปล ErrorCode เป็นภาษามนุษย์

import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export const USER_ERROR_MESSAGES: Record<string, string> = {
  //
  // ยกมาจาก error-codes.enum.ts

  [ErrorCode.DEFAULT_ERROR]:
    "ErrorCode Default ที่สร้างจาก all-exceptions.filter",

  [ErrorCode.PERSON_NOT_FOUND]:
    "ไม่พบข้อมูลโปรไฟล์ของคุณ กรุณาลงทะเบียนก่อนเข้าใช้งาน",
  [ErrorCode.ORGANIZATION_NOT_FOUND]: "ไม่พบองค์กรที่คุณพยายามเข้าถึง",
  [ErrorCode.ORGANIZATION_DELETED]: "องค์กรนี้ถูกปิดตัวหรือลบออกจากระบบไปแล้ว",
  [ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION]: "ไม่มีสิทธิเข้าถึงองค์กรนี้",

  // ==========================
  // Work-Schedule
  // ==========================

  [ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND]: "ไม่พบองค์กรที่คุณพยายามเข้าถึง",
  [ErrorCode.WORK_SCHEDULE_PLACE_DELETED]:
    "องค์กรนี้ถูกปิดตัวหรือลบออกจากระบบไปแล้ว",
  [ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE]: "ไม่มีสิทธิเข้าถึงข้อมูลนี้",

  [ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND]:
    "ไม่พบตำแหน่งงานที่คุณพยายามเข้าถึง",
  [ErrorCode.WORK_SCHEDULE_POSITION_DELETED]:
    "ตำแหน่งงานนี้ถูกลบออกจากระบบไปแล้ว",

  // อื่นๆ
  //
};
