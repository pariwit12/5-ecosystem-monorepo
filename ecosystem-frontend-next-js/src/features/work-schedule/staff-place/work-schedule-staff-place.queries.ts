import { queryOptions } from "@tanstack/react-query";
import { workScheduleStaffPlaceKeys } from "./work-schedule-staff-place-keys";
import { getStaffPlace } from "./api/get-staff-place.api";

export const workScheduleStaffPlaceQueries = {
  detail: (
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    placeId: string,
    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey:
        userId && placeId
          ? workScheduleStaffPlaceKeys.detail(userId, placeId)
          : [],
      queryFn: async () => {
        if (!placeId) throw new Error("Place ID is required");
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getStaffPlace(placeId, token, skipErrorCodes);
      },
      staleTime: 60 * 1000,
      enabled: !!userId && !!placeId,
    }),
};
