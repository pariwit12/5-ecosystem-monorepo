import apiClient from "@/lib/axios";

import { GetOrganizationsResponse } from "@backend/modules/organizations/queries/get-organizations.query";

// ==========================================
// 📦 ฟังก์ชันหลัก (Export ไปให้ Hook ใช้)
// ==========================================
export const getOrganizations = async (
  token: string,
): Promise<GetOrganizationsResponse> => {
  const response = await apiClient.get<GetOrganizationsResponse>(
    "/api/organizations",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
};
