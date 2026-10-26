import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleSlotKeys } from "../work-schedule-slot-keys";
import { updateSlot } from "../api/mutations/update-slot.api";

export const useUpdateSlot = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      positionId,
      slotId,
      data,
      skipErrorCodes,
    }: {
      positionId: string;
      slotId: string;
      data: {
        staff_id: string;
        slot_type_id: string;
        actual_start_time: string;
        actual_end_time: string;
      };
      skipErrorCodes?: string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return updateSlot(positionId, slotId, data, token, skipErrorCodes);
    },

    onSuccess: (_, variables) => {
      if (userId) {
        if (variables.positionId) {
          queryClient.invalidateQueries({
            queryKey: workScheduleSlotKeys.listsByPositionId(
              userId,
              variables.positionId,
            ),
          });
        }
        if (variables.slotId) {
          queryClient.invalidateQueries({
            queryKey: workScheduleSlotKeys.detail(
              userId,
              variables.positionId,
              variables.slotId,
            ),
          });
        }
      }
    },
  });
};
