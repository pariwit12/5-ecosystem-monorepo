import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleSlotKeys } from "@/features/work-schedule/slot/work-schedule-slot-keys";
import { workScheduleMinMaxKeys } from "../work-schedule-min-max-keys";
import { deleteMinMax } from "../api/mutations/delete.api";

export const useDelete = (positionId: string) => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (
      input: string | { minMaxId: string; skipErrorCodes?: readonly string[] },
    ) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      const minMaxId = typeof input === "string" ? input : input.minMaxId;
      const skipErrorCodes =
        typeof input === "string" ? undefined : input.skipErrorCodes;

      return deleteMinMax(positionId, minMaxId, token, skipErrorCodes);
    },

    onSuccess: (_, input) => {
      const minMaxId = typeof input === "string" ? input : input.minMaxId;
      if (userId && positionId) {
        queryClient.invalidateQueries({
          queryKey: workScheduleMinMaxKeys.listsByPositionId(userId, positionId),
        });
        queryClient.invalidateQueries({
          queryKey: workScheduleMinMaxKeys.detail(userId, positionId, minMaxId),
        });
        queryClient.invalidateQueries({
          queryKey: workScheduleSlotKeys.listsByPositionId(userId, positionId),
        });
      }
    },
  });
};
