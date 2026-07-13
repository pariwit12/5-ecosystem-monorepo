import { queryOptions } from "@tanstack/react-query";

import { workSchedulePlaceKeys } from "./work-schedule-place-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import { getWorkSchedulePlaceById } from "./api/queries/get-work-schedule-place-by-id.api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

export const workSchedulePlaceQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  queryGetWorkSchedulePlaceById: (
    placeId: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey: workSchedulePlaceKeys.detail(userId ?? "", placeId),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getWorkSchedulePlaceById(placeId, token, skipErrorCodes);
      },

      staleTime: 60 * 1000,

      enabled: !!userId && !!placeId,
    }),

  // ===========================================
  // (จบ) รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================
  //
};
