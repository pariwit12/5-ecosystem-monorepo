import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { getOrganizationById } from "../api/get-organization-by-id.api";
import { organizationKeys } from "./keys";

export const useGetOrganizationById = (
  // 🌟 รับ orgId เข้ามาเป็น Parameter (อนุญาตให้เป็น null/undefined ได้ เผื่อกรณีจังหวะแรกที่ยังโหลด Zustand หรือดึงค่าจาก URL ไม่ทัน)
  orgId?: string | null,
  skipErrorCodes?: string[],
) => {
  const { getToken, userId } = useAuth();

  return useQuery({
    // 🌟 ดึงกุญแจ "detail" จาก Factory และใส่ orgId ลงไป
    queryKey: userId && orgId ? organizationKeys.detail(userId, orgId) : [],

    queryFn: async () => {
      // ดักไว้ก่อน เผื่อ React Query พลาดหลุดเข้ามาทำงาน
      if (!orgId) throw new Error("Organization ID is required");

      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return getOrganizationById(orgId, token, skipErrorCodes);
    },

    // 🛡️ หัวใจสำคัญ: Query นี้จะ "ไม่ทำงานเด็ดขาด" จนกว่าจะมี userId และ orgId ครบถ้วน
    enabled: !!userId && !!orgId,
  });
};
