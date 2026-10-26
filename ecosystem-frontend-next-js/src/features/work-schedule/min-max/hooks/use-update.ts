import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleMinMaxKeys } from "../work-schedule-min-max-keys";
import { update, type UpdateDtoBody } from "../api/mutations/update.api";

export const useUpdate = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      positionId,
      minMaxId,
      data,
      skipErrorCodes,
    }: {
      positionId: string;
      minMaxId: string;
      data: UpdateDtoBody;
      skipErrorCodes?: readonly string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return update(positionId, minMaxId, data, token, skipErrorCodes);
    },

    onSuccess: (_, variables) => {
      if (userId && variables.positionId) {
        queryClient.invalidateQueries({
          queryKey: workScheduleMinMaxKeys.listsByPositionId(
            userId,
            variables.positionId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: workScheduleMinMaxKeys.detail(
            userId,
            variables.positionId,
            variables.minMaxId,
          ),
        });
      }
    },
  });
};
