import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { PageErrorList } from "./page-error-list.enum";

export const API_ERROR_MESSAGES: Record<ErrorCode, string> = {
  //
  // ยกมาจาก error-codes.enum.ts

  [ErrorCode.DEFAULT_ERROR]: "เกิดข้อผิดพลาด (ErrorCode.DEFAULT_ERROR)",

  // Person
  [ErrorCode.PERSON_NOT_FOUND]:
    "ไม่พบข้อมูลโปรไฟล์ของคุณ กรุณาลงทะเบียนก่อนเข้าใช้งาน",

  // Organization
  [ErrorCode.ORGANIZATION_NOT_FOUND]:
    "ไม่พบองค์กร (ORGANIZATION) ที่เกี่ยวข้องในระบบ",
  [ErrorCode.ORGANIZATION_DELETED]:
    "องค์กร (ORGANIZATION) ที่เกี่ยวข้อง ถูกลบออกจากระบบหรือปิดการใช้งานไปแล้ว",

  // Member
  [ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION]:
    "ต้องการสิทธิ สมาชิก (MEMBER) ในการเข้าถึงข้อมูล",

  // ===========================
  // PROGRAM: Work-Schedule
  // ===========================

  // Place
  [ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND]:
    "ไม่พบองค์กร (PLACE) ที่เกี่ยวข้องในระบบ",
  [ErrorCode.WORK_SCHEDULE_PLACE_DELETED]:
    "องค์กร (PLACE) ที่เกี่ยวข้อง ถูกลบออกจากระบบหรือปิดการใช้งานไปแล้ว",

  // Admin
  [ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE]:
    "ต้องการสิทธิ ผู้ดูแลระบบ (ADMIN) ในการเข้าถึงข้อมูล",

  // Position
  [ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND]:
    "ไม่พบตำแหน่งงาน (POSITION) ที่เกี่ยวข้องในระบบ",
  [ErrorCode.WORK_SCHEDULE_POSITION_DELETED]:
    "ตำแหน่งงาน (POSITION) ที่เกี่ยวข้อง ถูกลบออกจากระบบหรือปิดการใช้งานไปแล้ว",

  // Slot Template
  [ErrorCode.WORK_SCHEDULE_SLOT_TEMPLATE_NOT_FOUND]:
    "ไม่พบรายการแบบร่าง (SLOT TEMPLATE) ที่เกี่ยวข้องในระบบ",

  // ===========================
  // (จบ) PROGRAM: Work-Schedule
  // ===========================
};

export const PAGE_ERROR_MESSAGES: Record<PageErrorList, string> = {
  // รอเปลี่ยน
  [PageErrorList.INVALID_ID]: "รูปแบบของรหัสไม่ถูกต้อง หรือไม่มีอยู่จริงในระบบ",

  // ===========================
  // PROGRAM: Work-Schedule
  // ===========================

  // ===========================
  // (จบ) PROGRAM: Work-Schedule
  // ===========================
};
