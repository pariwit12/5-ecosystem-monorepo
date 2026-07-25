import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  GetAvailableStaffsByPositionIdResponse,
  GetAvailableStaffsByPositionIdDtoParamSchema,
} from "@backend/modules/work-schedule/staff-position/queries/get-available-staffs-by-position-id.query";

type GetAvailableStaffsByPositionIdDtoParam = z.infer<
  typeof GetAvailableStaffsByPositionIdDtoParamSchema
>;

export const getAvailableStaffsByPositionId = async (
  positionId: string,

  token: string,
  skipErrorCodes?: readonly string[],
): Promise<GetAvailableStaffsByPositionIdResponse> => {
  const paramData: GetAvailableStaffsByPositionIdDtoParam = {
    position_id: positionId,
  };

  const parsedParam =
    GetAvailableStaffsByPositionIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetAvailableStaffsByPositionIdResponse>(
    `/api/work-schedule/staff-position/available-staffs-by-position-id/${parsedParam.data.position_id}`,

    {
      headers: { Authorization: `Bearer ${token}` },

      skipErrorCodes: skipErrorCodes,
    },
  );

  return response.data;
};
