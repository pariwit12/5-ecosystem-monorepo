export const organizationKeys = {
  // 🌟 1. ลิ้นชักชั้นนอกสุด (Root) ต้องเอา userId มาแปะหน้าสุดเสมอ
  all: (userId: string) => [userId, "organizations"] as const,

  // 🌟 2. ลิ้นชักย่อยๆ ก็ต้องรับ userId มาส่งต่อให้ตัวแม่
  lists: (userId: string) => [...organizationKeys.all(userId), "list"] as const,
  list: (userId: string, filters: Record<string, unknown>) =>
    [...organizationKeys.lists(userId), { filters }] as const,

  details: (userId: string) =>
    [...organizationKeys.all(userId), "detail"] as const,
  detail: (userId: string, id: string) =>
    [...organizationKeys.details(userId), id] as const,
};
