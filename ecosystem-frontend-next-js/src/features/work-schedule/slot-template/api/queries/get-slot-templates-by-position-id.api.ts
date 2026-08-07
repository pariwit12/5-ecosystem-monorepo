import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  GetSlotTemplatesByPositionIdResponse,
  GetSlotTemplatesByPositionIdDtoParamSchema,
} from "@backend/modules/work-schedule/slot-template/queries/get-slot-templates-by-position-id.query";

type GetSlotTemplatesByPositionIdDtoParam = z.infer<
  typeof GetSlotTemplatesByPositionIdDtoParamSchema
>;

export const getSlotTemplatesByPositionId = async (
  positionId: string,

  token: string,
  skipErrorCodes?: readonly string[],
): Promise<GetSlotTemplatesByPositionIdResponse> => {
  const paramData: GetSlotTemplatesByPositionIdDtoParam = {
    position_id: positionId,
  };

  const parsedParam =
    GetSlotTemplatesByPositionIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetSlotTemplatesByPositionIdResponse>(
    `/api/work-schedule/slot-template/by-position-id/${parsedParam.data.position_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },

      skipErrorCodes: skipErrorCodes,
    },
  );

  return response.data;
};
