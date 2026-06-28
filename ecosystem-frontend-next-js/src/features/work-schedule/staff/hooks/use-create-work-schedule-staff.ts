import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { createWorkScheduleStaff } from "../api/mutations/create-work-schedule-staff.api";

import { workScheduleStaffKeys } from "../work-schedule-staff-keys";

export const useCreateWorkScheduleStaff = () => {
  const { getToken, userId } = useAuth(); // ดึงใน use-hooks
  const queryClient = useQueryClient();

  return useMutation({
    // mutationFn สามารถรับค่ามาได้แค่ 1 ตัวแปร จึงต้องใส่มาเป็น Object
    mutationFn: async ({
      placeId,
      name,
      skipErrorCodes,
    }: {
      placeId: string;
      name: string;
      skipErrorCodes?: string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return createWorkScheduleStaff(placeId, name, token, skipErrorCodes);
    },

    // ตัวแปรที่ 1 (_) คือ Response จาก API, ตัวแปรที่ 2 (variables) คือค่าที่ส่งเข้ามาใน mutationFn
    // ใส่ _ แปลว่า API นี้ไม่ได้ยิงอะไรกลับมา
    onSuccess: (_, variables) => {
      if (userId && variables.placeId) {
        // ล้าง cache
        queryClient.invalidateQueries({
          queryKey: workScheduleStaffKeys.listsByPlaceId(
            userId,
            variables.placeId,
          ),
        });
      }
    },
  });
};
