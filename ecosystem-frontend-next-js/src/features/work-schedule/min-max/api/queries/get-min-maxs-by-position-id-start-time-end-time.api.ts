import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  GetMinMaxsByPositionIdStartTimeEndTimeResponse,
  GetMinMaxsByPositionIdStartTimeEndTimeDtoParamSchema,
  GetMinMaxsByPositionIdStartTimeEndTimeDtoQuerySchema,
} from "@backend/modules/work-schedule/min-max/queries/get-min-maxs-by-position-id-start-time-end-time.query";

type GetMinMaxsByPositionIdStartTimeEndTimeDtoParam = z.infer<
  typeof GetMinMaxsByPositionIdStartTimeEndTimeDtoParamSchema
>;
type GetMinMaxsByPositionIdStartTimeEndTimeDtoQuery = z.infer<
  typeof GetMinMaxsByPositionIdStartTimeEndTimeDtoQuerySchema
>;

export const getMinMaxsByPositionIdStartTimeEndTime = async (
  positionId: string,

  startTime: string,
  endTime: string,

  token: string,
  skipErrorCodes?: readonly string[],
): Promise<GetMinMaxsByPositionIdStartTimeEndTimeResponse> => {
  const paramData: GetMinMaxsByPositionIdStartTimeEndTimeDtoParam = {
    position_id: positionId,
  };

  const parsedParam =
    GetMinMaxsByPositionIdStartTimeEndTimeDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const queryData: GetMinMaxsByPositionIdStartTimeEndTimeDtoQuery = {
    start_time: startTime,
    end_time: endTime,
  };

  const parsedQuery =
    GetMinMaxsByPositionIdStartTimeEndTimeDtoQuerySchema.safeParse(queryData);

  if (!parsedQuery.success) {
    const errorMessage =
      parsedQuery.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Query ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const response =
    await apiClient.get<GetMinMaxsByPositionIdStartTimeEndTimeResponse>(
      `/api/work-schedule/min-max/by-position-id-start-time-end-time/${parsedParam.data.position_id}`,

      {
        params: parsedQuery.data,

        headers: { Authorization: `Bearer ${token}` },

        skipErrorCodes: skipErrorCodes,
      },
    );

  return response.data;
};
