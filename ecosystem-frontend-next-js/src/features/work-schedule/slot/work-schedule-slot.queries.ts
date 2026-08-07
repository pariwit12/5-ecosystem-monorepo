import { queryOptions } from "@tanstack/react-query";

import { workScheduleSlotKeys } from "./work-schedule-slot-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import { getSlotsByPositionIdStartTimeEndTime } from "./api/queries/get-slots-by-position-id-start-time-end-time.api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

export const workScheduleSlotQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  queryGetSlotsByPositionIdStartTimeEndTime: (
    positionId: string,

    startTime: string,
    endTime: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey: workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(
        userId ?? "",
        positionId,
        startTime,
        endTime,
      ),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getSlotsByPositionIdStartTimeEndTime(
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

  // ===========================================
  // (จบ) รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================
  //
};
