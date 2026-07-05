//
// ฟังก์ชันตัวช่วย (Utility function) สำหรับจัดการ Class ของ Tailwind CSS

// ไว้ฝึกใช้ในภายหลัง (เอาไว้ใช้เขียนใน className)

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
