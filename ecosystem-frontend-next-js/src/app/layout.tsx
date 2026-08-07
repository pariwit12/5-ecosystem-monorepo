import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
// eslint-disable-next-line
import Sidebar from "@/components/use-by-layout/sidebar";
import "./globals.css";

import TanStackProvider from "@/provider/tan-stack-provider";
import { OfflineBanner } from "@/components/use-by-layout/offline-banner";

import GlobalErrorModal from "@/components/use-by-layout/global-error-modal";

import { Toaster } from "sonner";

import { Suspense } from "react";
import ToastNotifier from "@/components/use-by-layout/toast-notifier";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pariwit Ecosystem",
  description: "Ecosystem Frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // เอา ClerkProvider มาครอบโครงสร้างทั้งหมดไว้
    <ClerkProvider>
      <html
        lang="en"
        className={cn(
          //
          // ===============================
          // 🟢 1. จัดการเรื่องฟอนต์ (Fonts)
          // ===============================

          geistSans.variable,
          geistMono.variable,
          "antialiased", // ทำให้ขอบตัวหนังสือคมชัดขึ้น

          // ===============================
          // 🟢 2. โครงสร้างหลัก (Layout)
          // ===============================

          "h-full",

          "overflow-y-auto", // ควรใช้ + คนใช้เยอะที่สุด
          // "overflow-y-scroll", // เปิด scroll bar ไว้ตลอด ป้องกันปัญหาพื้นหลังไม่ต่อกัน

          // ===============================
          // 🟢 3. ป้องกันหน้าจอกระตุกจาก Scrollbar (กรณีใช้ overflow-y-auto)
          // ===============================

          "scrollbar-gutter-stable",

          // ความฉลาดของ scrollbar-gutter: stable:
          // เมื่อเราใส่คำสั่งนี้ลงไป เบราว์เซอร์จะทำการตรวจสอบ OS ของผู้ใช้ก่อนครับ
          // 💻 ถ้าผู้ใช้เปิดบน Windows (Classic): เบราว์เซอร์จะจองพื้นที่ 15px ไว้ให้ เพื่อไม่ให้หน้ากระตุกเวลาเนื้อหายาวขึ้น
          // 📱 ถ้าผู้ใช้เปิดบนมือถือ หรือ Mac (Overlay): เบราว์เซอร์จะรู้ทันทีว่า Scrollbar รุ่นนี้มันลอยทับเนื้อหาได้อยู่แล้ว
          // // มันจึง ระงับการจองพื้นที่ (จอง 0px) ทำให้มือถือหน้าจอเล็กๆ ของคุณไม่เสียพื้นที่สีขาวไปฟรีๆ แม้แต่พิกเซลเดียวครับ!
        )}
      >
        <body className={cn("min-h-full flex flex-col bg-gray-50")}>
          {/* ขยับ TanStackProvider มาครอบทั้งหมดตั้งแต่ตรงนี้! */}
          {/* เพื่อให้ Header และ Sidebar สามารถใช้ useQuery ดึง API ได้ด้วย */}
          <TanStackProvider>
            <OfflineBanner />
            {/* 🌟 OfflineBanner วางไว้บนสุด มันจะคอยเฝ้ามองแอปเราตลอดเวลา */}
            {/* --- Header --- */}
            <header className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50">
              <div className="text-xl font-bold text-blue-700">
                Pariwit Ecosystem
              </div>

              <div>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                      เข้าสู่ระบบ
                    </button>
                  </SignInButton>
                </Show>

                <Show when="signed-in">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 hidden sm:block">
                      ยินดีต้อนรับ
                    </span>
                    <UserButton
                      appearance={{
                        elements: { userButtonAvatarBox: "w-10 h-10" },
                      }}
                    />
                  </div>
                </Show>
              </div>
            </header>
            {/* 🌟 พื้นที่ด้านล่าง (แบ่งซ้าย-ขวา) 🌟 */}
            <div
              className={cn(
                //
                "flex flex-1 overflow-hidden",
              )}
            >
              {/* ซ้าย: Sidebar (โชว์เฉพาะตอนล็อกอินแล้ว) */}
              <Show when="signed-in">
                {/*  */}
                {/* <Sidebar /> */}
                {/*  */}
              </Show>

              {/* ขวา: พื้นที่เนื้อหาหลัก (children) */}
              <main
                className={cn(
                  //
                  "flex-1",
                )}
              >
                {/* 🌟 เนื้อหาหลักของแต่ละหน้าจะถูกนำมาแทรกตรงนี้ 🌟 */}
                {children}
              </main>
            </div>

            {/* 🌟 วาง Global Modal ไว้ล่างสุดของ DOM */}
            {/* เพื่อให้มันสามารถลอยทับ Header และ Sidebar ได้อย่างสมบูรณ์แบบ */}
            <GlobalErrorModal />

            {/* 🌟 ย้าย Toaster มาไว้ตรงนี้ครับ! จะได้ลอยทับหน้าเว็บได้อย่างสมบูรณ์แบบ */}
            {/* richColors คือการสั่งให้มีสีสวยๆ อัตโนมัติ (เช่น แดง=Error, เขียว=Success) */}
            <Toaster position="top-right" richColors />

            {/* 🌟 วาง ToastNotifier สำหรับดักจับ URL Params เบื้องหลัง 🌟 */}
            {/* จำเป็นต้องใช้ Suspense ครอบไว้ตามกฎของ Next.js App Router เมื่อใช้ useSearchParams */}
            <Suspense fallback={null}>
              <ToastNotifier />
            </Suspense>

            {/* ขยับ TanStack ไว้ตรงนี้ เพื่อให้ทุกส่วนสามารถใช้ API ได้ */}
          </TanStackProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
