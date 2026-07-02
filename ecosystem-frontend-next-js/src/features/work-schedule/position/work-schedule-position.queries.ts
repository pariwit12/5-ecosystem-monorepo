import { queryOptions } from "@tanstack/react-query";

import { workSchedulePositionKeys } from "./work-schedule-position-keys";

import { getWorkSchedulePositionsByPlaceId } from "./api/queries/get-work-schedule-positions-by-place-id.api";
import { getWorkSchedulePositionById } from "./api/queries/get-work-schedule-position-by-id.api";

export const workSchedulePositionQueries = {
  // 1
  queryGetWorkSchedulePositionsByPlaceId: (
    placeId: string,
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey: workSchedulePositionKeys.listsByPlaceId(userId ?? "", placeId),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getWorkSchedulePositionsByPlaceId(
          placeId,
          token,
          skipErrorCodes,
        );
      },

      staleTime: 60 * 1000,
      enabled: !!userId && !!placeId,
    }),

  // 2
  queryGetWorkSchedulePositionById: (
    positionId: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: string[],
    //
  ) =>
    queryOptions({
      queryKey: workSchedulePositionKeys.detail(userId ?? "", positionId),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getWorkSchedulePositionById(positionId, token, skipErrorCodes);
      },

      staleTime: 60 * 1000,
      enabled: !!userId && !!positionId,
    }),
};
