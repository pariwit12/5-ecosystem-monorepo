import { queryOptions } from "@tanstack/react-query";

import { workScheduleStaffPositionKeys } from "./work-schedule-staff-position-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import { getAvailableStaffsByPositionId } from "./api/queries/get-available-staffs-by-position-id.api";
import { getStaffPositionsByPositionId } from "./api/queries/get-staff-positions-by-position-id.api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

export const workScheduleStaffPositionQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  queryGetAvailableStaffsByPositionId: (
    positionId: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey: workScheduleStaffPositionKeys.availableStaffListsByPositionId(
        userId ?? "",
        positionId,
      ),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getAvailableStaffsByPositionId(
          positionId,
          token,
          skipErrorCodes,
        );
      },

      staleTime: 60 * 1000,

      enabled: !!userId && !!positionId,
    }),

  // 2
  queryGetStaffPositionsByPositionId: (
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

        return getStaffPositionsByPositionId(positionId, token, skipErrorCodes);
      },

      staleTime: 60 * 1000,

      enabled: !!userId && !!positionId,
    }),

  // ===========================================
  // (จบ) รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================
  //
};
