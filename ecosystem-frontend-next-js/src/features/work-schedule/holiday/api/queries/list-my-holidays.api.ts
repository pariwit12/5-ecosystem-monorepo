import apiClient from "@/lib/axios";
import {
  ListMyHolidaysDtoParamSchema,
  ListMyHolidaysResponse,
} from "@backend/modules/work-schedule/holiday/queries/list-my-holidays.query";

export const listMyHolidays = async (
  placeId: string,
  token: string,
  skipErrorCodes?: string[],
): Promise<ListMyHolidaysResponse> => {
  const parsedParam = ListMyHolidaysDtoParamSchema.safeParse({
    place_id: placeId,
  });

  if (!parsedParam.success) {
    throw new Error(
      parsedParam.error.issues[0]?.message ||
        "ข้อมูลที่จะส่งผ่าน Param ไม่ถูกต้อง",
    );
  }

  const response = await apiClient.get<ListMyHolidaysResponse>(
    `/api/work-schedule/holidays/places/${parsedParam.data.place_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );

  return response.data;
};
