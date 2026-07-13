import { queryOptions } from "@tanstack/react-query";

import { workScheduleSlotKeys } from "./work-schedule-slot-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import { getWorkScheduleSlotsByPositionId } from "./api/queries/get-work-schedule-slots-by-position-id.api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

export const workScheduleSlotQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  queryGetWorkScheduleSlotsByPositionId: (
    positionId: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey: workScheduleSlotKeys.listsByPositionId(
        userId ?? "",
        positionId,
      ),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getWorkScheduleSlotsByPositionId(
          positionId,
          token,
          skipErrorCodes,
        );
      },

      staleTime: 60 * 1000,

      enabled: !!userId && !!positionId,
    }),

  // ===========================================
  // (จบ) รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================
  //
};
