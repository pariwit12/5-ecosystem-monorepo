import { queryOptions } from "@tanstack/react-query";
import { workScheduleLogInKeys } from "./work-schedule-log-in-keys";
import { getUserRolesByClerkId } from "./api/queries/get-user-roles-by-clerk-id.api";

export const workScheduleLogInQueries = {
  // ผูก queryKey กับ API
  // ไม่ใช่ไฟล์ hooks แต่ทำหน้าที่คล้ายๆ (จึงต้องรับ getToken และ userId เข้ามา เรียกเองไม่ได้)

  // 1
  userRolesByClerkId: (
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      queryKey: userId ? workScheduleLogInKeys.lists(userId) : [],
      queryFn: async () => {
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        return getUserRolesByClerkId(token, skipErrorCodes);
      },

      staleTime: 60 * 1000,
      enabled: !!userId,
    }),
};
