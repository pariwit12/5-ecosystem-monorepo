// src/features/organizations/hooks/keys.ts

export const organizationKeys = {
  // 1. Key สำหรับดึงข้อมูลทั้งหมด
  all: ["organizations"] as const,

  // 2. Key สำหรับดึงข้อมูลเจาะจงรายคลินิก (รับ id เข้ามาต่อท้าย)
  detail: (id: string) => [...organizationKeys.all, "detail", id] as const,
};
