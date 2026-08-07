import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleSlotKeys } from "../work-schedule-slot-keys";

import { createMany } from "../api/mutations/create-many.api";

export const useCreateMany = () => {
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
        staff_id: string;
        slot_type_id: string;
        actual_start_time: string;
        actual_end_time: string;
      }[];
      skipErrorCodes?: string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return createMany(positionId, slots, token, skipErrorCodes);
    },

    onSuccess: (_, variables) => {
      if (userId && variables.positionId) {
        queryClient.invalidateQueries({
          queryKey: workScheduleSlotKeys.listsByPositionId(
            userId,
            variables.positionId,
          ),
        });
      }
    },
  });
};
