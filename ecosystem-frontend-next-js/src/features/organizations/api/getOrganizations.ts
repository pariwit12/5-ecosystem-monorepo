import apiClient from "@/lib/axios";

export interface Organization {
  id: string;
  name: string;
}

// รับ Token เข้ามาเป็น Parameter แทน เพื่อให้ฟังก์ชันนี้ไม่ต้องผูกติดกับ Clerk hook
export const getOrganizations = async (
  token: string,
): Promise<Organization[]> => {
  const response = await apiClient.get<{ organizations: Organization[] }>(
    "/api/organizations",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data.organizations || [];
};
