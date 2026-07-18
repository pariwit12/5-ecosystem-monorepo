import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleSlotKeys } from "../work-schedule-slot-keys";

import { createWorkScheduleSlot } from "../api/mutations/create-work-schedule-slot.api";

export const useCreateWorkScheduleSlot = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      positionId,
      slots,
      skipErrorCodes,
    }: {
      positionId: string;
      slots: {
        name: string;
        actual_start_time: string;
        actual_end_time: string;
      }[];
      skipErrorCodes?: string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return createWorkScheduleSlot(positionId, slots, token, skipErrorCodes);
    },

    onSuccess: (_, variables) => {
      //
      // ===============
      // ล้าง cache
      // ===============

      if (userId && variables.positionId) {
        queryClient.invalidateQueries({
          queryKey: workScheduleSlotKeys.listsByPositionId(
            userId,
            variables.positionId,
          ),
        });
      }

      // ===============
      // (จบ) ล้าง cache
      // ===============
      //
    },
  });
};
