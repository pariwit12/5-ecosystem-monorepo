import { queryOptions } from "@tanstack/react-query";

import { workScheduleSlotKeys } from "./work-schedule-slot-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import { getSlotsByPositionIdStartTimeEndTime } from "./api/queries/get-slots-by-position-id-start-time-end-time.api";
import { getMyWorkScheduleSlots } from './api/queries/get-my-work-schedule-slots.api';
import { getSlotById } from "./api/queries/get-slot-by-id.api";

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

  mySlotsByPlaceIdStartTimeEndTime: (
    placeId: string,
    startTime: string,
    endTime: string,
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey: workScheduleSlotKeys.myListsByPlaceIdStartTimeEndTime(
        userId ?? '',
        placeId,
        startTime,
        endTime,
      ),
      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error('Authentication token is missing');
        return getMyWorkScheduleSlots(
          placeId,
          startTime,
          endTime,
          token,
          skipErrorCodes,
        );
      },
      staleTime: 60 * 1000,
      enabled: !!userId && !!placeId && !!startTime && !!endTime,
    }),

  // 3
  queryGetSlotById: (
    positionId: string,
    slotId: string,
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey: workScheduleSlotKeys.detail(userId ?? "", positionId, slotId),
      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");
        return getSlotById(positionId, slotId, token, skipErrorCodes);
      },
      staleTime: 60 * 1000,
      enabled: !!userId && !!positionId && !!slotId,
    }),

  // ===========================================
  // (จบ) รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================
  //
};
