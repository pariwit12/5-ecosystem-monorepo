import apiClient from "@/lib/axios";
import {
  CreateHolidayDtoParamSchema,
  CreateHolidayDtoBodySchema,
} from "@backend/modules/work-schedule/holiday/commands/create-holiday.command";
import type { CreateHolidayResult } from "@backend/modules/work-schedule/holiday/commands/create-holiday.handler";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export interface CreateHolidayParamInput {
  place_id: string;
}

export type CreateHolidayBodyInput =
  | {
      type: "FULL_DAY";
      date: string;
    }
  | {
      type: "PARTIAL";
      start_time: string;
      end_time: string;
    };

export const createHoliday = async (
  param: CreateHolidayParamInput,
  body: CreateHolidayBodyInput,
  token: string,
  skipErrorCodes: readonly string[] = [
    ErrorCode.WORK_SCHEDULE_HOLIDAY_SLOT_OVERLAP,
  ],
): Promise<CreateHolidayResult> => {
  const parsedParam = CreateHolidayDtoParamSchema.safeParse(param);
  if (!parsedParam.success) {
    throw new Error(
      parsedParam.error.issues[0]?.message || "รหัส place_id ไม่ถูกต้อง",
    );
  }

  const parsedBody = CreateHolidayDtoBodySchema.safeParse(body);
  if (!parsedBody.success) {
    throw new Error(
      parsedBody.error.issues[0]?.message || "ข้อมูลวันหยุดไม่ถูกต้อง",
    );
  }

  const response = await apiClient.post<CreateHolidayResult>(
    `/api/work-schedule/holidays/places/${parsedParam.data.place_id}`,
    parsedBody.data,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );

  return response.data;
};
