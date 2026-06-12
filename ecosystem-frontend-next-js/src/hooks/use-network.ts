// เอาไว้ตรวจว่า ต่อเน็ต หรือ ยังไม่ได้ต่อเน็ต เพื่อเอาไปแสดง icon

"use client";

import { useSyncExternalStore } from "react";

// 1. ฟังก์ชันติดตาม Event (คอยบอก React เมื่อมีการเปลี่ยนแปลง)
const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

// 2. ฟังก์ชันดึงค่าปัจจุบันจากฝั่ง Browser
const getSnapshot = () => {
  return navigator.onLine;
};

// 3. ฟังก์ชันจำลองค่าฝั่ง Server (SSR) เพื่อกันแครช (สมมติว่าเน็ตดีไว้ก่อน)
const getServerSnapshot = () => {
  return true;
};

export function useNetwork() {
  // 🌟 ใช้ Hook ระดับเทพของ React 18 จัดการแทน useState และ useEffect ทั้งหมด!
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
