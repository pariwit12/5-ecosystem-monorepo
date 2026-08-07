import { queryOptions } from "@tanstack/react-query";

import { workScheduleSlotTypeKeys } from "./work-schedule-slot-type-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import { getSlotTypesByPositionId } from "./api/queries/get-slot-types-by-position-id.api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

export const workScheduleSlotTypeQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  queryGetSlotTypesByPositionId: (
    positionId: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey: workScheduleSlotTypeKeys.listsByPositionId(
        userId ?? "",
        positionId,
      ),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getSlotTypesByPositionId(
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
