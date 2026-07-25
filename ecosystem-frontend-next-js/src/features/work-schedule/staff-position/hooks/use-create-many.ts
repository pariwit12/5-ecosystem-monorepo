import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { workScheduleStaffPositionKeys } from "../work-schedule-staff-position-keys";

import { createMany } from "../api/mutations/create-many.api";

export const useCreateMany = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      positionId,

      staffIds,

      skipErrorCodes,
    }: {
      positionId: string;

      staffIds: string[];

      skipErrorCodes?: readonly string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      return createMany(
        positionId,

        staffIds,

        token,
        skipErrorCodes,
      );
    },

    onSuccess: (_, variables) => {
      if (userId && variables.positionId) {
        // 1
        queryClient.invalidateQueries({
          queryKey: workScheduleStaffPositionKeys.listsByPositionId(
            userId,
            variables.positionId,
          ),
        });

        // 2
        queryClient.invalidateQueries({
          queryKey:
            workScheduleStaffPositionKeys.availableStaffListsByPositionId(
              userId,
              variables.positionId,
            ),
        });
      }
    },
  });
};
