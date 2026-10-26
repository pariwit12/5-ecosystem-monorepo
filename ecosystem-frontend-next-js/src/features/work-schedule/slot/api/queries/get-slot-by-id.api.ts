import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  GetSlotByIdResponse,
  GetSlotByIdDtoParamSchema,
} from "@backend/modules/work-schedule/slot/queries/get-slot-by-id.query";

type GetSlotByIdDtoParam = z.infer<typeof GetSlotByIdDtoParamSchema>;

export const getSlotById = async (
  positionId: string,
  slotId: string,
  token: string,
  skipErrorCodes?: readonly string[],
): Promise<GetSlotByIdResponse> => {
  const paramData: GetSlotByIdDtoParam = {
    position_id: positionId,
    slot_id: slotId,
  };

  const parsedParam = GetSlotByIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetSlotByIdResponse>(
    `/api/work-schedule/slot/positions/${parsedParam.data.position_id}/slots/${parsedParam.data.slot_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes: skipErrorCodes,
    },
  );

  return response.data;
};
