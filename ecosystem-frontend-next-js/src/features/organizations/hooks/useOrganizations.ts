import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import apiClient from "@/lib/axios";

// 🌟 (สมมติ) ดึง Type ที่เสกมาจาก Zod Base Schema ของคุณแบงค์
import { Organization } from "@/schemas/organization";

// 🎯 สร้าง Key ศูนย์กลาง ป้องกันการสะกดผิด
export const organizationKeys = {
  all: ["organizations"] as const,
};

// ==========================================
// [GET] Hook สำหรับดึงข้อมูล
// ==========================================
export const useOrganizations = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: organizationKeys.all,
    queryFn: async () => {
      const token = await getToken();
      const response = await apiClient.get<{ organizations: Organization[] }>(
        "/api/organizations",
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data.organizations || [];
    },
  });
};

// ==========================================
// [POST] Hook สำหรับสร้างข้อมูล
// ==========================================
export const useCreateOrganization = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const token = await getToken();
      const response = await apiClient.post(
        "/api/organizations",
        { name },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    },
    onSuccess: () => {
      // 🌟 สั่งให้ตารางรีเฟรชข้อมูลใหม่ทันทีหลังสร้างเสร็จ
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
    },
  });
};
