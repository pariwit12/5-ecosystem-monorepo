import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workSchedulePositionKeys } from "../work-schedule-position-keys";

import { createWorkSchedulePosition } from "../api/mutations/create-work-schedule-position.api";

export const useCreateWorkSchedulePosition = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      placeId,
      name,
      skipErrorCodes,
    }: {
      placeId: string;
      name: string;
      skipErrorCodes?: string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return createWorkSchedulePosition(placeId, name, token, skipErrorCodes);
    },

    onSuccess: (_, variables) => {
      if (userId && variables.placeId) {
        queryClient.invalidateQueries({
          queryKey: workSchedulePositionKeys.listsByPlaceId(
            userId,
            variables.placeId,
          ),
        });
      }
    },
  });
};
