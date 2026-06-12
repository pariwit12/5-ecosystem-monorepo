import { queryOptions } from "@tanstack/react-query";

import {
  // ปรับตามใช้งานจริง
  templateKeys,

  // ปรับตามใช้งานจริง
} from "./[template]-keys";

import {
  // ปรับตามใช้งานจริง
  getTemplate,

  // ปรับตามใช้งานจริง
} from "./api/queries/get-[template].api";

// ปรับตามใช้งานจริง
export const templateQueries = {
  // ผูก queryKey กับ API
  // ไม่ใช่ไฟล์ hooks แต่ทำหน้าที่คล้ายๆ (จึงต้องรับ getToken และ userId เข้ามา เรียกเองไม่ได้)

  // 1
  // ปรับตามใช้งานจริง
  detail: (
    // ปรับตามใช้งานจริง
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,
    orgId: string,
    valueOne: string,
    valueTwo: string,
    skipErrorCodes?: string[],
  ) =>
    queryOptions({
      // ปรับตามใช้งานจริง
      queryKey: userId && orgId ? templateKeys.detail(userId, orgId) : [],
      queryFn: async () => {
        // ปรับตามใช้งานจริง
        if (!orgId) throw new Error("Organization ID is required");
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        // ปรับตามใช้งานจริง
        return getTemplate(
          // ปรับตามใช้งานจริง
          orgId,
          valueOne,
          valueTwo,
          token,
          skipErrorCodes,
        );
      },

      // ปรับตามใช้งานจริง
      staleTime: 60 * 1000,

      // ปรับตามใช้งานจริง
      enabled: !!userId && !!orgId,
    }),
};
