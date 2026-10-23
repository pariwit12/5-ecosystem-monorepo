import { queryOptions } from "@tanstack/react-query";
import { workScheduleHolidayKeys } from "./work-schedule-holiday-keys";
import { listMyHolidays } from "./api/queries/list-my-holidays.api";

export const workScheduleHolidayQueries = {
  list: (
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    placeId: string,
    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey: workScheduleHolidayKeys.list(userId, placeId),
      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("ไม่พบ Token สำหรับยืนยันตัวตน");
        return listMyHolidays(placeId, token, skipErrorCodes);
      },
      enabled: !!userId && !!placeId,
    }),
};
