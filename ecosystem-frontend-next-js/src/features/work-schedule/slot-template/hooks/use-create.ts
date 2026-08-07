import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleSlotTemplateKeys } from "../work-schedule-slot-template-keys";

import { create } from "../api/mutations/create.api";

export const useCreate = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      positionId,

      slotTypeId,
      name,
      startTime,
      durationMinute,

      skipErrorCodes,
    }: {
      positionId: string;

      slotTypeId: string;
      name: string;
      startTime: string;
      durationMinute: number;

      skipErrorCodes?: string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return create(
        positionId,

        slotTypeId,
        name,
        startTime,
        durationMinute,

        token,
        skipErrorCodes,
      );
    },

    onSuccess: (_, variables) => {
      if (userId && variables.positionId) {
        queryClient.invalidateQueries({
          queryKey: workScheduleSlotTemplateKeys.listsByPositionId(
            userId,
            variables.positionId,
          ),
        });
      }
    },
  });
};
