import { queryOptions } from "@tanstack/react-query";

import { workScheduleStaffPositionKeys } from "./work-schedule-staff-position-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import { getWorkScheduleStaffPositionsByPositionId } from "./api/queries/get-work-schedule-staff-positions-by-position-id.api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

export const workScheduleStaffPositionQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  queryGetWorkScheduleStaffPositionsByPositionId: (
    positionId: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey: workScheduleStaffPositionKeys.listsByPositionId(
        userId ?? "",
        positionId,
      ),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getWorkScheduleStaffPositionsByPositionId(
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
