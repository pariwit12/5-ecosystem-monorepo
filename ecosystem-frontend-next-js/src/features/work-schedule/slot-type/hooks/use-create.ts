import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleSlotTypeKeys } from "../work-schedule-slot-type-keys";

import { create } from "../api/mutations/create.api";

export const useCreate = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      positionId,

      name,

      skipErrorCodes,
    }: {
      positionId: string;

      name: string;

      skipErrorCodes?: readonly string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return create(
        positionId,

        name,

        token,
        skipErrorCodes,
      );
    },

    onSuccess: (_, variables) => {
      if (userId && variables.positionId) {
        // 1
        queryClient.invalidateQueries({
          queryKey: workScheduleSlotTypeKeys.listsByPositionId(
            userId,
            variables.positionId,
          ),
        });
      }
    },
  });
};
