// ใช้ส่งค่าให้ SmartContextGuard เพื่อให้รู้ว่าจะตรวจอะไรบ้าง

import { SetMetadata } from '@nestjs/common';

// กำหนดระดับความปลอดภัยที่ระบบเรามี
export type ContextLevel = 'PERSON' | 'ORGANIZATION';

// ตั้งชื่อ key สำหรับเก็บข้อมูล ContextLevel ใน Metadata ของ API แต่ละเส้น
export const REQUIRE_CONTEXT_KEY = 'require_context';
// ค่า 'require_context' คือ key ที่เราจะใช้แปะข้อมูลระดับความปลอดภัยลงไปใน Metadata ของ API แต่ละเส้น (ผ่าน @SetMetadata) และ SmartContextGuard จะดึงข้อมูลนี้มาใช้ตรวจสอบต่อไป
// REQUIRE_CONTEXT_KEY เป็นแค่ตัวแปรเก็บ string ธรรมดาๆ แต่เราตั้งเป็นตัวแปรขึ้นมาเพื่อให้ TypeScript ทำงานช่วยเวลาพิมพ์โค้ดผิด ลดโอกาสเกิดบั๊ก

// สร้าง Decorator
export const RequireContext = (level: ContextLevel) =>
  SetMetadata(REQUIRE_CONTEXT_KEY, level);

// SetMetadata ทำหน้าที่เหมือนการเอาสติกเกอร์ไปแปะซ่อนไว้หลัง API เพื่อรอให้ Guard มาแกะอ่าน
