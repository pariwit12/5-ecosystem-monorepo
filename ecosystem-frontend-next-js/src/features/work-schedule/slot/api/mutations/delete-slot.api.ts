import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";
import { DeleteSlotDtoParamSchema } from "@backend/modules/work-schedule/slot/commands/delete-slot.command";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export type DeleteSlotDtoParam = z.infer<typeof DeleteSlotDtoParamSchema>;

export const deleteSlot = async (
  positionId: string,
  slotId: string,
  token: string,
  skipErrorCodes: readonly string[] = [ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND],
): Promise<void> => {
  const paramData: DeleteSlotDtoParam = {
    position_id: positionId,
    slot_id: slotId,
  };

  const parsedParam = DeleteSlotDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  await apiClient.delete(
    `/api/work-schedule/slot/positions/${parsedParam.data.position_id}/slots/${parsedParam.data.slot_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );
};
