import { queryOptions } from "@tanstack/react-query";

// ==>>==>>== Import Keys ==<<==<<==

import {
  // ปรับตามใช้งานจริง
  programFeatureKeys,

  // ปรับตามใช้งานจริง
} from "./[program]-[feature]-keys";

// ==>>==>>== (จบ) Import Keys ==<<==<<==

// ============================================
// ---------- Import Function (.api) ----------
// ============================================

import {
  // ปรับตามใช้งานจริง
  getAvailableOtherProgramFeatures,

  // ปรับตามใช้งานจริง
} from "./api/queries/get-[available_null]-[other-program_null]-[features_feature].api";

// ============================================
// ------- (จบ) Import Function (.api) --------
// ============================================

// ปรับตามใช้งานจริง
export const programFeatureQueries = {
  //
  // ===========================================
  // รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================

  // 1
  // ปรับตามใช้งานจริง
  queryGetAvailableOtherProgramFeatures: (
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
    skipErrorCodes?: readonly string[],
  ) =>
    queryOptions({
      queryKey:
        // ปรับตามใช้งานจริง
        programFeatureKeys.listsByValueOne(
          //
          // ปรับตามใช้งานจริง
          userId ?? "",
          valueOne,
        ),

      queryFn: async () => {
        //
        // ปรับตามใช้งานจริง
        if (!valueOne) throw new Error("ValueOne is required");
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        // ปรับตามใช้งานจริง
        return getAvailableOtherProgramFeatures(
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
      staleTime: 60 * 1000,

      // ปรับตามใช้งานจริง
      enabled: !!userId && !!valueOne,
    }),

  // ===========================================
  // (จบ) รายการ Query (ผูก QueryKey กับ QueryAPI)
  // ===========================================
  //
};
