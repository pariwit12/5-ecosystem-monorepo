import { queryOptions } from "@tanstack/react-query";

import { workScheduleMinMaxKeys } from "./work-schedule-min-max-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import { getMinMaxsByPositionIdStartTimeEndTime } from "./api/queries/get-min-maxs-by-position-id-start-time-end-time.api";
import { getMinMaxById } from "./api/queries/get-min-max-by-id.api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

export const workScheduleMinMaxQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  queryGetMinMaxsByPositionIdStartTimeEndTime: (
    positionId: string,

    startTime: string,
    endTime: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey: workScheduleMinMaxKeys.listsByPositionIdStartTimeEndTime(
        userId ?? "",
        positionId,
        startTime,
        endTime,
      ),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getMinMaxsByPositionIdStartTimeEndTime(
          positionId,

          startTime,
          endTime,

          token,
          skipErrorCodes,
        );
      },

      staleTime: 60 * 1000,

      enabled: !!userId && !!positionId && !!startTime && !!endTime,
    }),

  queryGetMinMaxById: (
    positionId: string,
    minMaxId: string,
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey: workScheduleMinMaxKeys.detail(userId ?? "", positionId, minMaxId),
      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getMinMaxById(positionId, minMaxId, token, skipErrorCodes);
      },
      staleTime: 60 * 1000,
      enabled: !!userId && !!positionId && !!minMaxId,
    }),

  // ===========================================
  // (จบ) รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================
  //
};
