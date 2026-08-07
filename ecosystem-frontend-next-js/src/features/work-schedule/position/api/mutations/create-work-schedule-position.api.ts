import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  CreateWorkSchedulePositionDtoParamSchema,
  CreateWorkSchedulePositionDtoBodySchema,
} from "@backend/modules/work-schedule/position/commands/create-work-schedule-position.command";

export type CreateWorkSchedulePositionDtoParam = z.infer<
  typeof CreateWorkSchedulePositionDtoParamSchema
>;
export type CreateWorkSchedulePositionDtoBody = z.infer<
  typeof CreateWorkSchedulePositionDtoBodySchema
>;

export const createWorkSchedulePosition = async (
  placeId: string,

  name: string,

  token: string,
  // eslint-disable-next-line
  skipErrorCodes?: string[],
): Promise<void> => {
  const paramData: CreateWorkSchedulePositionDtoParam = {
    place_id: placeId,
  };

  const parsedParam =
    CreateWorkSchedulePositionDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const bodyData: CreateWorkSchedulePositionDtoBody = {
    name: name,
  };

  const parsedBody =
    CreateWorkSchedulePositionDtoBodySchema.safeParse(bodyData);

  if (!parsedBody.success) {
    const errorMessage =
      parsedBody.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Body ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  await apiClient.post<void>(
    `/api/work-schedule/position/${parsedParam.data.place_id}`,

    parsedBody.data,

    {
      headers: { Authorization: `Bearer ${token}` },

      // skipErrorCodes: skipErrorCodes,
    },
  );

  return;
};
