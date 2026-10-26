import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  UpdateDtoParamSchema,
  UpdateDtoBodySchema,
} from "@backend/modules/work-schedule/min-max/commands/update.command";

export type UpdateDtoParam = z.infer<typeof UpdateDtoParamSchema>;
export type UpdateDtoBody = z.infer<typeof UpdateDtoBodySchema>;

export const update = async (
  positionId: string,
  minMaxId: string,
  data: UpdateDtoBody,
  token: string,
  skipErrorCodes?: readonly string[],
): Promise<void> => {
  const paramData: UpdateDtoParam = {
    position_id: positionId,
    min_max_id: minMaxId,
  };

  const parsedParam = UpdateDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const parsedBody = UpdateDtoBodySchema.safeParse(data);

  if (!parsedBody.success) {
    const errorMessage =
      parsedBody.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Body ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  await apiClient.patch<void>(
    `/api/work-schedule/min-max/positions/${parsedParam.data.position_id}/min-maxs/${parsedParam.data.min_max_id}`,
    parsedBody.data,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );
};
