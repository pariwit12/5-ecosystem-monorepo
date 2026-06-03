// ชื่อใหม่ของ middleware.ts ที่ Clerk กำลังให้เปลี่ยนเป็น proxy.ts

import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // ข้ามการตรวจเช็คไฟล์ระบบของ Next.js และไฟล์ภาพ/CSS ต่างๆ เพื่อความรวดเร็ว
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // บังคับให้ตรวจสอบเสมอสำหรับ API Routes
    "/(api|trpc)(.*)",
  ],
};
