import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  GetSlotTypesByPositionIdResponse,
  GetSlotTypesByPositionIdDtoParamSchema,
} from "@backend/modules/work-schedule/slot-type/queries/get-slot-types-by-position-id.query";

type GetSlotTypesByPositionIdDtoParam = z.infer<
  typeof GetSlotTypesByPositionIdDtoParamSchema
>;

export const getSlotTypesByPositionId = async (
  positionId: string,

  token: string,
  skipErrorCodes?: readonly string[],
): Promise<GetSlotTypesByPositionIdResponse> => {
  const paramData: GetSlotTypesByPositionIdDtoParam = {
    position_id: positionId,
  };

  const parsedParam =
    GetSlotTypesByPositionIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetSlotTypesByPositionIdResponse>(
    `/api/work-schedule/slot-type/by-position-id/${parsedParam.data.position_id}`,

    {
      headers: { Authorization: `Bearer ${token}` },

      skipErrorCodes: skipErrorCodes,
    },
  );

  return response.data;
};
