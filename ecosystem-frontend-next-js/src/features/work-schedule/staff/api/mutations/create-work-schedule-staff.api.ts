import apiClient from "@/lib/axios";
import { z } from "zod";
import { useErrorStore } from "@/store/use-error-store";

import {
  CreateWorkScheduleStaffDtoParamSchema,
  CreateWorkScheduleStaffDtoBodySchema,
} from "@backend/modules/work-schedule/staff/commands/create-work-schedule-staff.command";

export type CreateWorkScheduleStaffDtoParam = z.infer<
  typeof CreateWorkScheduleStaffDtoParamSchema
>;
export type CreateWorkScheduleStaffDtoBody = z.infer<
  typeof CreateWorkScheduleStaffDtoBodySchema
>;

export const createWorkScheduleStaff = async (
  placeId: string,

  name: string,

  token: string,
  // eslint-disable-next-line
  skipErrorCodes?: string[],
): Promise<void> => {
  const paramData: CreateWorkScheduleStaffDtoParam = {
    place_id: placeId,
  };

  const parsedParam =
    CreateWorkScheduleStaffDtoParamSchema.safeParse(paramData);

  if (!parsedParam.success) {
    const errorMessage =
      parsedParam.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Param ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  const bodyData: CreateWorkScheduleStaffDtoBody = {
    name: name,
  };

  const parsedBody = CreateWorkScheduleStaffDtoBodySchema.safeParse(bodyData);

  if (!parsedBody.success) {
    const errorMessage =
      parsedBody.error.issues[0]?.message ||
      "ข้อมูลที่จะส่งผ่าน Body ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้";

    useErrorStore.getState().showError("ข้อมูลไม่ถูกต้อง", errorMessage, 400);

    throw new Error(errorMessage);
  }

  await apiClient.post<void>(
    `/api/work-schedule/staff/${parsedParam.data.place_id}`,
    parsedBody.data,
    {
      headers: { Authorization: `Bearer ${token}` },

      // skipErrorCodes: skipErrorCodes,
    },
  );

  return;
};
