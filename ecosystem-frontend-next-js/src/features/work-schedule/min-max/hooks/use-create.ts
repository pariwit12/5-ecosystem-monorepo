import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleMinMaxKeys } from "../work-schedule-min-max-keys";

import { create } from "../api/mutations/create.api";

export const useCreate = () => {
  const queryClient = useQueryClient();

  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      positionId,

      min,
      max,
      startTime,
      endTime,

      skipErrorCodes,
    }: {
      positionId: string;

      min: number | undefined;
      max: number | undefined;
      startTime: string;
      endTime: string;

      skipErrorCodes?: readonly string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return create(
        positionId,

        min,
        max,
        startTime,
        endTime,

        token,
        skipErrorCodes,
      );
    },

    onSuccess: (_, variables) => {
      if (userId && variables.positionId) {
        // 1
        queryClient.invalidateQueries({
          queryKey: workScheduleMinMaxKeys.listsByPositionId(
            userId,
            variables.positionId,
          ),
        });
      }
    },
  });
};
