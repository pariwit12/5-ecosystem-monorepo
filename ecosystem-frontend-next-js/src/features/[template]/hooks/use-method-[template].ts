import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import {
  // ปรับตามใช้งานจริง
  methodTemplate,

  // ปรับตามใช้งานจริง
} from "../api/mutations/method-[template].api";

import {
  // ปรับตามใช้งานจริง
  templateKeys,

  // ปรับตามใช้งานจริง
} from "../[template]-keys";

// ปรับตามใช้งานจริง
export const useMethodTemplate = () => {
  const { getToken, userId } = useAuth(); // ดึงใน use-hooks
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn สามารถรับค่ามาได้แค่ 1 ตัวแปร จึงต้องใส่มาเป็น Object
    mutationFn: async ({
      // ปรับตามใช้งานจริง
      orgId,
      valueOne,
      valueTwo,
      skipErrorCodes,
    }: {
      orgId: string;
      valueOne: string;
      valueTwo: string;
      skipErrorCodes?: string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return methodTemplate(
        // ปรับตามใช้งานจริง
        orgId,
        valueOne,
        valueTwo,
        token,
        skipErrorCodes,
      );
    },

    // ตัวแปรที่ 1 (_) คือ Response จาก API, ตัวแปรที่ 2 (variables) คือค่าที่ส่งเข้ามาใน mutationFn
    // ใส่ _ แปลว่า API นี้ไม่ได้ยิงอะไรกลับมา
    onSuccess: (_, variables) => {
      if (userId && variables.orgId) {
        // ล้าง cache
        queryClient.invalidateQueries({
          // ปรับตามใช้งานจริง
          queryKey: templateKeys.listsByOrganizationId(
            // ปรับตามใช้งานจริง
            userId,
            variables.orgId,
          ),
        });
      }
    },
  });
};
