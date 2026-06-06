// 🌟 หน้าบ้านรับหน้าที่แปล ErrorCode เป็นภาษามนุษย์
export const USER_ERROR_MESSAGES: Record<string, string> = {
  // ยกมาจาก error-codes.enum.ts
  PERSON_NOT_FOUND: "ไม่พบข้อมูลโปรไฟล์ของคุณ กรุณาลงทะเบียนก่อนเข้าใช้งาน",
  ORGANIZATION_NOT_FOUND: "ไม่พบองค์กรที่คุณพยายามเข้าถึง",
  ORGANIZATION_DELETED: "องค์กรนี้ถูกปิดตัวหรือลบออกจากระบบไปแล้ว",
  NOT_A_MEMBER_OF_ORGANIZATION: "ไม่มีสิทธิเข้าถึงองค์กรนี้",

  // อื่นๆ
  NETWORK_ERROR:
    "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต หรือลองอีกครั้งในภายหลัง",
};
