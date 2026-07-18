import { queryOptions } from "@tanstack/react-query";

import { workScheduleSlotTemplateKeys } from "./work-schedule-slot-template-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import { getWorkScheduleSlotTemplateById } from "./api/queries/get-work-schedule-slot-template-by-id.api";
import { getWorkScheduleSlotTemplatesByPositionId } from "./api/queries/get-work-schedule-slot-templates-by-position-id.api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

export const workScheduleSlotTemplateQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  queryGetWorkScheduleSlotTemplatesByPositionId: (
    positionId: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey: workScheduleSlotTemplateKeys.listsByPositionId(
        userId ?? "",
        positionId,
      ),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getWorkScheduleSlotTemplatesByPositionId(
          positionId,
          token,
          skipErrorCodes,
        );
      },

      staleTime: 60 * 1000,

      enabled: !!userId && !!positionId,
    }),

  // 2
  queryGetWorkScheduleSlotTemplateById: (
    slotTemplateId: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey: workScheduleSlotTemplateKeys.detail(
        userId ?? "",
        slotTemplateId,
      ),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getWorkScheduleSlotTemplateById(
          slotTemplateId,
          token,
          skipErrorCodes,
        );
      },

      staleTime: 60 * 1000,

      enabled: !!userId && !!slotTemplateId,
    }),

  // ===========================================
  // (จบ) รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================
  //
};
