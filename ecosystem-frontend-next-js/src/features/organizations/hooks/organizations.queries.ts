import { queryOptions } from "@tanstack/react-query";
import { organizationKeys } from "./keys";

import { getOrganizations } from "../api/get-organizations.api";
import { getOrganizationById } from "../api/get-organization-by-id.api";

// 🌟 รวมทุก "พิมพ์เขียว" ที่เกี่ยวกับ Organization ไว้ที่นี่ที่เดียว!
export const organizationsQueries = {
  // 1. พิมพ์เขียวสำหรับ: ดึงรายชื่อทั้งหมด (List)
  lists: (
    userId: string | null | undefined,
    // 🌟 รับฟังก์ชันมาทั้งก้อน ดึง token เองไม่ได้ เพราะไม่ใช่ hooks แล้วก็ให้ข้างนอกดึงมาก็ต้องใช้ await และ useEffect
    getToken: () => Promise<string | null>,
  ) =>
    queryOptions({
      queryKey: userId ? organizationKeys.lists(userId) : [],
      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getOrganizations(token);
      },
      staleTime: 60 * 1000,
      enabled: !!userId,
    }),

  // 2. พิมพ์เขียวสำหรับ: ดึงรายตัว (Detail)
  detail: (
    userId: string | null | undefined,
    orgId: string,
    // 🌟 รับฟังก์ชันมาทั้งก้อน ดึง token เองไม่ได้ เพราะไม่ใช่ hooks แล้วก็ให้ข้างนอกดึงมาก็ต้องใช้ await และ useEffect
    getToken: () => Promise<string | null>,
    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey: userId && orgId ? organizationKeys.detail(userId, orgId) : [],
      queryFn: async () => {
        if (!orgId) throw new Error("Organization ID is required");
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getOrganizationById(orgId, token, skipErrorCodes);
      },
      staleTime: 60 * 1000,
      enabled: !!userId && !!orgId,
    }),
};
