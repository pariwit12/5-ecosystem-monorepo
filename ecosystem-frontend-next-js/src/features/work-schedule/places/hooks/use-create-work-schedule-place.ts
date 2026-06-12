import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import {
  createWorkSchedulePlace,
  CreateWorkSchedulePlaceDtoBody,
} from "../api/create-work-schedule-place.api";
import { workSchedulePlacesKeys } from "./keys";

export const useCreateWorkSchedulePlace = () => {
  // 🌟 ดึง userId ออกมาเตรียมไว้
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn สามารถรับค่ามาได้แค่ 1 ตัวแปร จึงต้องใส่มาเป็น Object
    mutationFn: async ({
      orgId,
      body,
    }: {
      orgId: string;
      body: CreateWorkSchedulePlaceDtoBody;
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return createWorkSchedulePlace(orgId, token, body);
    },

    // ตัวแปรที่ 1 ใส่ _ แปลว่า API ที่ยิงไม่ได้ส่งอะไรกลับมา, ตัวแปรที่ 2 คือ ของที่ mutationFn รับมา
    onSuccess: (_, variables) => {
      // 🌟 สั่งระเบิด Cache โดยระบุตัวตน (ระเบิดเฉพาะลิ้นชักของ User คนนี้)
      if (userId && variables.orgId) {
        queryClient.invalidateQueries({
          queryKey: workSchedulePlacesKeys.placeListByOrganizationId(
            userId,
            variables.orgId,
          ),
        });
      }
    },
  });
};
