import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs"; // 👈 1. นำเข้า Clerk
import Sidebar from "@/components/sidebar"; // 👈 นำเข้า Sidebar
import "./globals.css";
import TanStackProvider from "@/provider/tan-stack-provider";
import GlobalErrorModal from "@/components/global-error-modal";
import { Toaster } from "sonner";
import { OfflineBanner } from "@/components/offline-banner";

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
    // 👇 2. เอา ClerkProvider มาครอบโครงสร้างทั้งหมดไว้
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-gray-50">
          {/* 🌟 2. ขยับ TanStackProvider มาครอบทั้งหมดตั้งแต่ตรงนี้! */}
          {/* เพื่อให้ Header และ Sidebar สามารถใช้ useQuery ดึง API ได้ด้วย */}
          <TanStackProvider>
            <OfflineBanner />
            {/* 🌟 OfflineBanner วางไว้บนสุด มันจะคอยเฝ้ามองแอปเราตลอดเวลา */}
            {/* --- Header --- */}
            <header className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
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
            <div className="flex flex-1 overflow-hidden">
              {/* ซ้าย: Sidebar (โชว์เฉพาะตอนล็อกอินแล้ว) */}
              <Show when="signed-in">
                {/*  */}
                {/* <Sidebar /> */}
                {/*  */}
              </Show>

              {/* ขวา: พื้นที่เนื้อหาหลัก (children) */}
              <main className="flex-1 overflow-y-auto">
                {/* 🌟 เนื้อหาหลักของแต่ละหน้าจะถูกนำมาแทรกตรงนี้ 🌟 */}
                {children}
              </main>
            </div>
            {/* 🌟 4. วาง Global Modal ไว้ล่างสุดของ DOM */}
            {/* เพื่อให้มันสามารถลอยทับ Header และ Sidebar ได้อย่างสมบูรณ์แบบ */}
            <GlobalErrorModal />
            {/* 🌟 ย้าย Toaster มาไว้ตรงนี้ครับ! จะได้ลอยทับหน้าเว็บได้อย่างสมบูรณ์แบบ */}
            {/* richColors คือการสั่งให้มีสีสวยๆ อัตโนมัติ (เช่น แดง=Error, เขียว=Success) */}
            <Toaster position="top-right" richColors />
            {/* ขยับ TanStack ไว้ตรงนี้ เพื่อให้ทุกส่วนสามารถใช้ API ได้ */}
          </TanStackProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
