import apiClient from "@/lib/axios";
import { DeleteHolidayDtoParamSchema } from "@backend/modules/work-schedule/holiday/commands/delete-holiday.command";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export interface DeleteHolidayParamInput {
  place_id: string;
  holiday_id: string;
}

export const deleteHoliday = async (
  param: DeleteHolidayParamInput,
  token: string,
  skipErrorCodes: readonly string[] = [
    ErrorCode.WORK_SCHEDULE_HOLIDAY_NOT_FOUND,
  ],
): Promise<void> => {
  const parsedParam = DeleteHolidayDtoParamSchema.safeParse(param);
  if (!parsedParam.success) {
    throw new Error(
      parsedParam.error.issues[0]?.message || "ข้อมูล Param ไม่ถูกต้อง",
    );
  }

  await apiClient.delete(
    `/api/work-schedule/holidays/places/${parsedParam.data.place_id}/${parsedParam.data.holiday_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );
};
