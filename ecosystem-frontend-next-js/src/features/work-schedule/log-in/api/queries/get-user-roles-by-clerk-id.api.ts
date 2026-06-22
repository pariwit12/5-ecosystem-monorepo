import apiClient from "@/lib/axios";

import { GetUserRolesByClerkIdResponse } from "@backend/modules/work-schedule/log-in/queries/get-user-roles-by-clerk-id.query";

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
export const getUserRolesByClerkId = async (
  token: string,
  skipErrorCodes?: string[],
): Promise<GetUserRolesByClerkIdResponse> => {
  const response = await apiClient.get<GetUserRolesByClerkIdResponse>(
    `/api/work-schedule/log-in`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes: skipErrorCodes,
    },
  );

  return response.data;
};
