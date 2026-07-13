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
      name,
      actualStartTime,
      actualEndTime,
      skipErrorCodes,
    }: {
      positionId: string;
      name: string;
      actualStartTime: string;
      actualEndTime: string;
      skipErrorCodes?: string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return createWorkScheduleSlot(
        positionId,
        name,
        actualStartTime,
        actualEndTime,
        token,
        skipErrorCodes,
      );
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
