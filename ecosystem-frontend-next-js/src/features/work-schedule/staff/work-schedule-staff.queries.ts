import { queryOptions } from "@tanstack/react-query";

import { workScheduleStaffKeys } from "./work-schedule-staff-keys";

import { getWorkScheduleStaffByPlaceId } from "./api/queries/get-work-schedule-staff-by-place-id.api";

export const workScheduleStaffQueries = {
  // 1
  listsByPlaceId: (
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    placeId: string,
    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey:
        userId && placeId
          ? workScheduleStaffKeys.listsByPlaceId(userId, placeId)
          : [],
      queryFn: async () => {
        if (!placeId) throw new Error("Place ID is required");
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getWorkScheduleStaffByPlaceId(placeId, token, skipErrorCodes);
      },

      staleTime: 60 * 1000,
      enabled: !!userId && !!placeId,
    }),
};
