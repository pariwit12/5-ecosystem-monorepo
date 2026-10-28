import apiClient from "@/lib/axios";
import { useErrorStore } from "@/store/use-error-store";
import { z } from "zod";
import {
  AutoCreateDtoParamSchema,
  AutoCreateDtoBodySchema,
  type AutoCreateResponse,
} from "@backend/modules/work-schedule/slot/commands/auto-create.command";

export type AutoCreateDtoBody = z.infer<typeof AutoCreateDtoBodySchema>;

export const autoCreate = async (
  positionId: string,
  body: AutoCreateDtoBody,
  token: string,
  skipErrorCodes?: readonly string[],
): Promise<AutoCreateResponse> => {
  const parsedParam = AutoCreateDtoParamSchema.safeParse({
    position_id: positionId,
  });
  const parsedBody = AutoCreateDtoBodySchema.safeParse(body);

  if (!parsedParam.success || !parsedBody.success) {
    const errorMessage =
      (!parsedParam.success && parsedParam.error.issues[0]?.message) ||
      (!parsedBody.success && parsedBody.error.issues[0]?.message) ||
      "ข้อมูลไม่ถูกต้อง ไม่สามารถส่งคำขอจัดเวรอัตโนมัติได้";
    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);
    throw new Error(errorMessage);
  }

  const response = await apiClient.post<AutoCreateResponse>(
    `/api/work-schedule/slot/positions/${parsedParam.data.position_id}/auto`,
    parsedBody.data,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );
  return response.data;
};
