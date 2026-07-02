import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  GetWorkSchedulePositionByIdResponse,
  GetWorkSchedulePositionByIdDtoParamSchema,
} from "@backend/modules/work-schedule/position/queries/get-work-schedule-position-by-id.query";

type GetWorkSchedulePositionByIdDtoParam = z.infer<
  typeof GetWorkSchedulePositionByIdDtoParamSchema
>;

export const getWorkSchedulePositionById = async (
  positionId: string,

  token: string,
  skipErrorCodes?: string[],
): Promise<GetWorkSchedulePositionByIdResponse> => {
  const paramData: GetWorkSchedulePositionByIdDtoParam = {
    position_id: positionId,
  };

  const parsedParam =
    GetWorkSchedulePositionByIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetWorkSchedulePositionByIdResponse>(
    `/api/work-schedule/position/by-id/${parsedParam.data.position_id}`,

    {
      headers: { Authorization: `Bearer ${token}` },

      skipErrorCodes: skipErrorCodes,
    },
  );

  return response.data;
};
