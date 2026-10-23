import apiClient from "@/lib/axios";
import {
  GetStaffPlaceParamDtoSchema,
  GetStaffPlaceResponse,
} from "@backend/modules/work-schedule/staff-place/queries/get-staff-place.query";

export const getStaffPlace = async (
  placeId: string,
  token: string,
  skipErrorCodes?: string[],
): Promise<GetStaffPlaceResponse> => {
  const parsedParam = GetStaffPlaceParamDtoSchema.safeParse({
    place_id: placeId,
  });

  if (!parsedParam.success) {
    throw new Error(
      parsedParam.error.issues[0]?.message ||
        "ข้อมูลที่จะส่งผ่าน Param ไม่ถูกต้อง",
    );
  }

  const response = await apiClient.get<GetStaffPlaceResponse>(
    `/api/work-schedule/staff-place/${parsedParam.data.place_id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );

  return response.data;
};
