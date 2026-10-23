import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  createHoliday,
  CreateHolidayBodyInput,
  CreateHolidayParamInput,
} from "../api/mutations/create-holiday.api";
import { workScheduleHolidayKeys } from "../work-schedule-holiday-keys";

export const useCreateHoliday = (placeId: string) => {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateHolidayBodyInput) => {
      const token = await getToken();
      if (!token) throw new Error("ไม่พบ Token สำหรับยืนยันตัวตน");
      const param: CreateHolidayParamInput = { place_id: placeId };
      return createHoliday(param, body, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workScheduleHolidayKeys.list(userId, placeId),
      });
    },
  });
};
