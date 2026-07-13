import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleSlotTemplateKeys } from "../work-schedule-slot-template-keys";

import { createWorkScheduleSlotTemplate } from "../api/mutations/create-work-schedule-slot-template.api";

export const useCreateWorkScheduleSlotTemplate = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      positionId,
      name,
      startTime,
      durationMinute,
      quantity,
      skipErrorCodes,
    }: {
      positionId: string;
      name: string;
      startTime: string;
      durationMinute: number;
      quantity: number;
      skipErrorCodes?: string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return createWorkScheduleSlotTemplate(
        positionId,
        name,
        startTime,
        durationMinute,
        quantity,
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
          queryKey: workScheduleSlotTemplateKeys.listsByPositionId(
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
