import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  CreateDtoParamSchema,
  CreateDtoBodySchema,
} from "@backend/modules/work-schedule/min-max/commands/create.command";

export type CreateDtoParam = z.infer<typeof CreateDtoParamSchema>;
export type CreateDtoBody = z.infer<typeof CreateDtoBodySchema>;

export const create = async (
  positionId: string,

  min: number | undefined,
  max: number | undefined,
  startTime: string,
  endTime: string,

  token: string,
  // eslint-disable-next-line
  skipErrorCodes?: readonly string[],
): Promise<void> => {
  const paramData: CreateDtoParam = {
    position_id: positionId,
  };

  const parsedParam = CreateDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const bodyData: CreateDtoBody = {
    min: min,
    max: max,
    start_time: startTime,
    end_time: endTime,
  };

  const parsedBody = CreateDtoBodySchema.safeParse(bodyData);

  if (!parsedBody.success) {
    const errorMessage =
      parsedBody.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Body ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  await apiClient.post<void>(
    `/api/work-schedule/min-max/${parsedParam.data.position_id}`,

    parsedBody.data,

    {
      headers: { Authorization: `Bearer ${token}` },

      // skipErrorCodes: skipErrorCodes,
    },
  );

  return;
};
