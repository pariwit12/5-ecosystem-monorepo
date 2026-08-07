import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  CreateManyDtoParamSchema,
  CreateManyDtoBodySchema,
} from "@backend/modules/work-schedule/slot/commands/create-many.command";

export type CreateManyDtoParam = z.infer<typeof CreateManyDtoParamSchema>;
export type CreateManyDtoBody = z.infer<typeof CreateManyDtoBodySchema>;

export const createMany = async (
  positionId: string,

  slots: {
    staff_id: string;
    slot_type_id: string;
    actual_start_time: string;
    actual_end_time: string;
  }[],

  token: string,
  // eslint-disable-next-line
  skipErrorCodes?: string[],
): Promise<void> => {
  const paramData: CreateManyDtoParam = {
    position_id: positionId,
  };

  const parsedParam = CreateManyDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const bodyData: CreateManyDtoBody = {
    slots: slots,
  };

  const parsedBody = CreateManyDtoBodySchema.safeParse(bodyData);

  if (!parsedBody.success) {
    const errorMessage =
      parsedBody.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Body ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  await apiClient.post<void>(
    `/api/work-schedule/slot/${parsedParam.data.position_id}`,

    parsedBody.data,

    {
      headers: { Authorization: `Bearer ${token}` },

      // skipErrorCodes: skipErrorCodes,
    },
  );

  return;
};
