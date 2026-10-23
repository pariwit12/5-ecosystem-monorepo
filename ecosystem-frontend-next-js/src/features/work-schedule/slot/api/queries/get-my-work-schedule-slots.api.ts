import apiClient from '@/lib/axios';
import { useErrorStore } from '@/store/use-error-store';
import { z } from 'zod';
import {
  GetMyWorkScheduleSlotsDtoParamSchema,
  GetMyWorkScheduleSlotsDtoQuerySchema,
  type GetMyWorkScheduleSlotsResponse,
} from '@backend/modules/work-schedule/slot/queries/get-my-work-schedule-slots.query';

export const getMyWorkScheduleSlots = async (
  placeId: string,
  startTime: string,
  endTime: string,
  token: string,
  skipErrorCodes?: readonly string[],
): Promise<GetMyWorkScheduleSlotsResponse> => {
  const parsedParam = GetMyWorkScheduleSlotsDtoParamSchema.safeParse({
    place_id: placeId,
  });
  const parsedQuery = GetMyWorkScheduleSlotsDtoQuerySchema.safeParse({
    start_time: startTime,
    end_time: endTime,
  });

  if (!parsedParam.success || !parsedQuery.success) {
    const validationError = !parsedParam.success
      ? parsedParam.error
      : !parsedQuery.success
        ? parsedQuery.error
        : undefined;
    const errorMessage =
      validationError?.issues[0]?.message ??
      'ข้อมูลที่จะส่งผ่าน Query ไม่ผ่านเงื่อนไขของ zod ไม่สามารถส่ง request ได้';
    useErrorStore.getState().showError('ข้อมูลไม่ถูกต้อง', errorMessage, 400);
    throw new Error(errorMessage);
  }

  const response = await apiClient.get<GetMyWorkScheduleSlotsResponse>(
    `/api/work-schedule/slot/my/places/${parsedParam.data.place_id}`,
    {
      params: parsedQuery.data,
      headers: { Authorization: `Bearer ${token}` },
      skipErrorCodes,
    },
  );

  return response.data;
};
