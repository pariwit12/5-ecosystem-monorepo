import { queryOptions } from "@tanstack/react-query";

import { workScheduleSlotTemplateKeys } from "./work-schedule-slot-template-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import { getSlotTemplateById } from "./api/queries/get-slot-template-by-id.api";
import { getSlotTemplatesByPositionId } from "./api/queries/get-slot-templates-by-position-id.api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

export const workScheduleSlotTemplateQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  queryGetSlotTemplateById: (
    slotTemplateId: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey: workScheduleSlotTemplateKeys.detail(
        userId ?? "",
        slotTemplateId,
      ),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getSlotTemplateById(
          slotTemplateId,

          token,
          skipErrorCodes,
        );
      },

      staleTime: 60 * 1000,

      enabled: !!userId && !!slotTemplateId,
    }),

  // 2
  queryGetSlotTemplatesByPositionId: (
    positionId: string,

    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey: workScheduleSlotTemplateKeys.listsByPositionId(
        userId ?? "",
        positionId,
      ),

      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getSlotTemplatesByPositionId(
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
