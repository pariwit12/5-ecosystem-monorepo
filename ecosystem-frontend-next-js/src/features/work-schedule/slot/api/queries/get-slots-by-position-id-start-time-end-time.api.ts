import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  GetSlotsByPositionIdStartTimeEndTimeResponse,
  GetSlotsByPositionIdStartTimeEndTimeDtoParamSchema,
  GetSlotsByPositionIdStartTimeEndTimeDtoQuerySchema,
} from "@backend/modules/work-schedule/slot/queries/get-slots-by-position-id-start-time-end-time.query";

type GetSlotsByPositionIdStartTimeEndTimeDtoParam = z.infer<
  typeof GetSlotsByPositionIdStartTimeEndTimeDtoParamSchema
>;
type GetSlotsByPositionIdStartTimeEndTimeDtoQuery = z.infer<
  typeof GetSlotsByPositionIdStartTimeEndTimeDtoQuerySchema
>;

export const getSlotsByPositionIdStartTimeEndTime = async (
  positionId: string,

  startTime: string,
  endTime: string,

  token: string,
  skipErrorCodes?: readonly string[],
): Promise<GetSlotsByPositionIdStartTimeEndTimeResponse> => {
  const paramData: GetSlotsByPositionIdStartTimeEndTimeDtoParam = {
    position_id: positionId,
  };

  const parsedParam =
    GetSlotsByPositionIdStartTimeEndTimeDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const queryData: GetSlotsByPositionIdStartTimeEndTimeDtoQuery = {
    start_time: startTime,
    end_time: endTime,
  };

  const parsedQuery =
    GetSlotsByPositionIdStartTimeEndTimeDtoQuerySchema.safeParse(queryData);

  if (!parsedQuery.success) {
    const errorMessage =
      parsedQuery.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Query ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const response =
    await apiClient.get<GetSlotsByPositionIdStartTimeEndTimeResponse>(
      `/api/work-schedule/slot/by-position-id-start-time-end-time/${parsedParam.data.position_id}`,

      {
        params: parsedQuery.data,

        headers: { Authorization: `Bearer ${token}` },

        skipErrorCodes: skipErrorCodes,
      },
    );

  return response.data;
};
