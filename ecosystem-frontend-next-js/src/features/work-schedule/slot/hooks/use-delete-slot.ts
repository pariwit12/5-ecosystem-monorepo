import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleSlotKeys } from "../work-schedule-slot-keys";
import { deleteSlot } from "../api/mutations/delete-slot.api";

export const useDeleteSlot = (positionId: string) => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async (
      input: string | { slotId: string; skipErrorCodes?: string[] },
    ) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      const slotId = typeof input === "string" ? input : input.slotId;
      const skipErrorCodes =
        typeof input === "string" ? undefined : input.skipErrorCodes;

      return deleteSlot(positionId, slotId, token, skipErrorCodes);
    },

    onSuccess: (_, input) => {
      const slotId = typeof input === "string" ? input : input.slotId;
      if (userId) {
        if (positionId) {
          queryClient.invalidateQueries({
            queryKey: workScheduleSlotKeys.listsByPositionId(
              userId,
              positionId,
            ),
          });
        }
        if (slotId) {
          queryClient.invalidateQueries({
            queryKey: workScheduleSlotKeys.detail(userId, positionId, slotId),
          });
        }
      }
    },
  });
};
