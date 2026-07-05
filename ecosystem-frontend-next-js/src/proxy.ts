// ชื่อใหม่ของ middleware.ts ที่ Clerk กำลังให้เปลี่ยนเป็น proxy.ts

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. กำหนดว่า Path ไหนบ้างที่ต้องล็อกอินก่อนถึงจะเข้าได้
// ใช้ (.*) เพื่อให้ครอบคลุมทุก sub-path เช่น /work-schedule/admin/...
const isProtectedRoute = createRouteMatcher([
  //
  // สามารถเพิ่ม path อื่นๆ ได้ที่นี่

  "/organizations(.*)",
  "/person(.*)",
  "/work-schedule(.*)",

  //
]);

export default clerkMiddleware(async (auth, req) => {
  // 2. ถ้า URL ที่ผู้ใช้กำลังเข้า ตรงกับรายการที่ต้องป้องกัน ให้ดักสิทธิ์ทันที
  if (isProtectedRoute(req)) {
    await auth.protect(); // ถ้าไม่ได้ล็อกอิน Clerk จะเตะกลับไปหน้า Login ให้เอง
    // ถ้า User ยังไม่ Log-in แล้วเข้า URL ที่ Protect ไว้ ระบบจะส่งไปหน้า Log-in Clerk (หน้าตาประมาณ https://bursting-mite-55.accounts.dev/sign-in?redirect_url=http%3A%2F%2Flocalhost%3A3000%2Fwork-schedule%2Fadmin%2F019edb0a-05df-725c-a2b4-8ce15e7322a6)
    // แล้วพอ User Log-in เรียบร้อย ระบบจะ Redirect ไปหน้าต่างที่ User ใส่มาตอนแรกโดยอัตโนมัติ

    // ========================================================
    // โค้ดกรณี Clerk ไม่ redirect ไปหน้าต่างที่ user จะเข้าอย่างถูกต้อง
    // ========================================================
    // // 2. ดึงข้อมูล auth และฟังก์ชัน redirectToSignIn (สำหรับ Clerk v5 ต้องใช้ await)
    // const { userId, redirectToSignIn } = await auth();
    // // 3. ถ้าไม่มี userId แปลว่ายังไม่ได้ล็อกอิน
    // if (!userId) {
    //   // 🌟 สั่งเตะไปหน้า Login พร้อมกับบังคับให้จำ URL ปัจจุบัน (req.url) เพื่อกลับมา!
    //   return redirectToSignIn({ returnBackUrl: req.url });
    // }
  }
});

export const config = {
  matcher: [
    // ข้ามการตรวจเช็คไฟล์ระบบของ Next.js และไฟล์ภาพ/CSS ต่างๆ เพื่อความรวดเร็ว
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // บังคับให้ตรวจสอบเสมอสำหรับ API Routes
    "/(api|trpc)(.*)",
  ],
};
