import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  UpdateSlotDtoParamSchema,
  UpdateSlotDtoBodySchema,
  UpdateSlotResponse,
} from "@backend/modules/work-schedule/slot/commands/update-slot.command";

export type UpdateSlotDtoParam = z.infer<typeof UpdateSlotDtoParamSchema>;
export type UpdateSlotDtoBody = z.infer<typeof UpdateSlotDtoBodySchema>;

export const updateSlot = async (
  positionId: string,
  slotId: string,
  data: {
    staff_id: string;
    slot_type_id: string;
    actual_start_time: string;
    actual_end_time: string;
  },
  token: string,
  skipErrorCodes?: readonly string[],
): Promise<UpdateSlotResponse> => {
  const paramData: UpdateSlotDtoParam = {
    position_id: positionId,
    slot_id: slotId,
  };

  const parsedParam = UpdateSlotDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const parsedBody = UpdateSlotDtoBodySchema.safeParse(data);

  if (!parsedBody.success) {
    const errorMessage =
      parsedBody.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Body ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const response = await apiClient.patch<UpdateSlotResponse>(
    `/api/work-schedule/slot/positions/${parsedParam.data.position_id}/slots/${parsedParam.data.slot_id}`,
    parsedBody.data,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes: skipErrorCodes,
    },
  );

  return response.data;
};
