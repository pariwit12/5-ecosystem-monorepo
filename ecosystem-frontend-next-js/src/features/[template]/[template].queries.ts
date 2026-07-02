import { queryOptions } from "@tanstack/react-query";

// ---------- Import Keys ----------
import {
  // ปรับตามใช้งานจริง
  templateKeys,

  // ปรับตามใช้งานจริง
} from "./[template]-keys";

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import {
  // ปรับตามใช้งานจริง
  getTemplate,

  // ปรับตามใช้งานจริง
} from "./api/queries/get-[template].api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

// ปรับตามใช้งานจริง
export const templateQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  // ปรับตามใช้งานจริง
  queryGetTemplate: (
    //
    // ปรับตามใช้งานจริง
    valueOne: string,
    valueTwo: string,
    valueThree: string,

    // ปรับตามใช้งานจริง
    // ต้องรับ getToken และ userId เข้ามา เรียกเองไม่ได้
    userId: string | null | undefined,
    getToken: () => Promise<string | null>,

    // ปรับตามใช้งานจริง
    skipErrorCodes?: string[],
    //
  ) =>
    queryOptions({
      queryKey:
        //
        templateKeys // ปรับตามใช้งานจริง
          //
          // ปรับตามใช้งานจริง
          .listsByValueOne(
            //
            // ปรับตามใช้งานจริง
            userId ?? "",
            valueOne,
            //
          ),

      queryFn: async () => {
        //
        // ปรับตามใช้งานจริง
        if (!valueOne) throw new Error("ValueOne is required");
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        // ปรับตามใช้งานจริง
        return getTemplate(
          //
          // ปรับตามใช้งานจริง
          valueOne,
          valueTwo,
          valueThree,
          token,
          skipErrorCodes,
        );
      },

      // ปรับตามใช้งานจริง
      staleTime: 60 * 1000, // ปรับตามใช้งานจริง

      // ปรับตามใช้งานจริง
      enabled:
        //
        // ปรับตามใช้งานจริง
        !!userId && // ปรับตามใช้งานจริง
        !!valueOne, // ปรับตามใช้งานจริง
      //
    }),

  // ===========================================
  // (จบ) รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================
  //
};
