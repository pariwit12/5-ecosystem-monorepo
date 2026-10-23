import { queryOptions } from "@tanstack/react-query";
import { workScheduleStaffInvitationKeys } from "./work-schedule-staff-invitation-keys";
import {
  listMineStaffInvitationsApi,
  listStaffInvitationsByPlaceApi,
} from "./api";

export const workScheduleStaffInvitationQueries = {
  mine: (
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey: userId ? workScheduleStaffInvitationKeys.mine(userId) : [],
      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");
        return listMineStaffInvitationsApi(token, skipErrorCodes);
      },
      staleTime: 30 * 1000,
      enabled: !!userId,
    }),

  byPlace: (
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    placeId: string,
    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey:
        userId && placeId
          ? workScheduleStaffInvitationKeys.byPlace(userId, placeId)
          : [],
      queryFn: async () => {
        if (!placeId) throw new Error("Place ID is required");
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");
        return listStaffInvitationsByPlaceApi(placeId, token, skipErrorCodes);
      },
      staleTime: 30 * 1000,
      enabled: !!userId && !!placeId,
    }),
};
