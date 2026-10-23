import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  deleteHoliday,
  DeleteHolidayParamInput,
} from "../api/mutations/delete-holiday.api";
import { workScheduleHolidayKeys } from "../work-schedule-holiday-keys";

export const useDeleteHoliday = (placeId: string) => {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holidayId: string) => {
      const token = await getToken();
      if (!token) throw new Error("ไม่พบ Token สำหรับยืนยันตัวตน");
      const param: DeleteHolidayParamInput = {
        place_id: placeId,
        holiday_id: holidayId,
      };
      return deleteHoliday(param, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workScheduleHolidayKeys.list(userId, placeId),
      });
    },
  });
};
