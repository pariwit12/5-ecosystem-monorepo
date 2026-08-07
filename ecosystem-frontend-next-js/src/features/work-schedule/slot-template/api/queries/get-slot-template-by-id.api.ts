import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  GetSlotTemplateByIdResponse,
  GetSlotTemplateByIdDtoParamSchema,
} from "@backend/modules/work-schedule/slot-template/queries/get-slot-template-by-id.query";

type GetSlotTemplateByIdDtoParam = z.infer<
  typeof GetSlotTemplateByIdDtoParamSchema
>;

export const getSlotTemplateById = async (
  slotTemplateId: string,

  token: string,
  skipErrorCodes?: readonly string[],
): Promise<GetSlotTemplateByIdResponse> => {
  const paramData: GetSlotTemplateByIdDtoParam = {
    slot_template_id: slotTemplateId,
  };

  const parsedParam = GetSlotTemplateByIdDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetSlotTemplateByIdResponse>(
    `/api/work-schedule/slot-template/by-id/${parsedParam.data.slot_template_id}`,

    {
      headers: { Authorization: `Bearer ${token}` },

      skipErrorCodes: skipErrorCodes,
    },
  );

  return response.data;
};
