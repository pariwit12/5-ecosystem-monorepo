// ไฟล์นี้จะแอบเอาไปใส่ไว้ที่ layout.tsx
// เพื่อตรวจสอบ clerk_id ของผู้ใช้ว่ามีบัญชีใน Person ของเราหรือยัง ถ้ายังไม่มีจะได้สร้างให้เลย
// และจะรันแค่ครั้งเดียว ตามพฤติกรรมของ layout.tsx

"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import apiClient from "@/lib/axios";

export function ClerkPersonSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🌟 ดึงแค่ userId และ getToken ก็พอแล้ว!
  const { userId, getToken } = useAuth();

  useEffect(() => {
    // 🌟 ถ้ายังไม่มี userId (ไม่ว่าจะกำลังโหลด หรือไม่ได้ล็อกอิน) ให้หยุดเลย = ไม่ต้องตรวจสอบ
    // userId = clerk_id ของเรานั่นเอง
    if (!userId) return;

    const syncUser = async () => {
      try {
        const token = await getToken();
        await apiClient.post(
          "/api/persons/sync-person-to-clerk",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } catch (error) {
        console.error("Failed to sync user:", error);
      }
    };

    syncUser();
  }, [userId, getToken]);

  return <>{children}</>;
}
