import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  autoCreate,
  type AutoCreateDtoBody,
} from "../api/mutations/auto-create.api";
import { workScheduleSlotKeys } from "../work-schedule-slot-keys";

export const useAutoCreate = () => {
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      positionId,
      targetMode,
      startTime,
      endTime,
      slotTemplateIds,
      staffIds,
      skipErrorCodes,
    }: {
      positionId: string;
      targetMode: AutoCreateDtoBody["target_mode"];
      startTime: string;
      endTime: string;
      slotTemplateIds: string[];
      staffIds: string[];
      skipErrorCodes?: readonly string[];
    }) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");
      return autoCreate(
        positionId,
        {
          target_mode: targetMode,
          start_time: startTime,
          end_time: endTime,
          slot_template_ids: slotTemplateIds,
          staff_ids: staffIds,
        },
        token,
        skipErrorCodes,
      );
    },
    onSuccess: (_, variables) => {
      if (userId && variables.positionId) {
        return queryClient.invalidateQueries({
          queryKey: workScheduleSlotKeys.listsByPositionId(
            userId,
            variables.positionId,
          ),
        });
      }
    },
  });
};
