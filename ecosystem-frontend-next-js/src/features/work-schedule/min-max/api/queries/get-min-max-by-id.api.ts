import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  GetMinMaxByIdResponse,
  GetMinMaxByIdDtoParamSchema,
} from "@backend/modules/work-schedule/min-max/queries/get-min-max-by-id.query";

type GetMinMaxByIdDtoParam = z.infer<typeof GetMinMaxByIdDtoParamSchema>;

export const getMinMaxById = async (
  positionId: string,
  minMaxId: string,
  token: string,
  skipErrorCodes?: readonly string[],
): Promise<GetMinMaxByIdResponse> => {
  const paramData: GetMinMaxByIdDtoParam = {
    position_id: positionId,
    min_max_id: minMaxId,
  };

  const parsedParam = GetMinMaxByIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetMinMaxByIdResponse>(
    `/api/work-schedule/min-max/positions/${parsedParam.data.position_id}/min-maxs/${parsedParam.data.min_max_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );

  return response.data;
};
