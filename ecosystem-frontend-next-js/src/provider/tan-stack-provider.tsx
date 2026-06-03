"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function TanStackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🌟 สร้าง QueryClient ไว้ใน useState เพื่อป้องกันไม่ให้มันถูกสร้างใหม่ (Re-create)
  // ทุกครั้งที่ Next.js เปลี่ยนหน้า หรือเกิดการ Re-render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🕒 ตั้งค่าอายุของแคช (ปรับเปลี่ยนได้ตามความเหมาะสมของคลินิก)
            staleTime: 1000 * 60 * 1, // 1 นาที: ข้อมูลจะถูกมองว่า "เก่า" ทันที (ถ้าเปลี่ยนหน้าแล้วกลับมา จะดึง API ใหม่เงียบๆ)
            gcTime: 1000 * 60 * 5, // 5 นาที: ลบขยะจาก RAM อัตโนมัติ (ถ้าไม่ได้ใช้ข้อมูลนี้นานเกิน 5 นาที)

            // 🛡️ ตั้งค่าพฤติกรรมพื้นฐาน
            refetchOnWindowFocus: false, // ปิดไว้ก่อน เพื่อไม่ให้ API ยิงรัวๆ ตอนพนักงานสลับแท็บเบราว์เซอร์ไปมา

            // ปิดระบบ retry เพราะ เรามี auto-retry ของ axios อยู่แล้ว เพื่อไม่ให้ระบบพัง และไปใช้ที่ axios จะดีกว่า
            retry: false, // 🌟 ปิดทิ้ง ให้ Axios รับจบเรื่อง Network
            // retry: 1, // ถ้าดึงข้อมูลพลาด (เช่น เน็ตกระตุก) ให้ลองใหม่ 1 ครั้งก่อนแจ้ง Error
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
