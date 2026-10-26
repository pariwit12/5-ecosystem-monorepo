import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";
import { DeleteDtoParamSchema } from "@backend/modules/work-schedule/min-max/commands/delete.command";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export type DeleteDtoParam = z.infer<typeof DeleteDtoParamSchema>;

export const deleteMinMax = async (
  positionId: string,
  minMaxId: string,
  token: string,
  skipErrorCodes: readonly string[] = [ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND],
): Promise<void> => {
  const paramData: DeleteDtoParam = {
    position_id: positionId,
    min_max_id: minMaxId,
  };

  const parsedParam = DeleteDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  await apiClient.delete(
    `/api/work-schedule/min-max/positions/${parsedParam.data.position_id}/min-maxs/${parsedParam.data.min_max_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );
};
