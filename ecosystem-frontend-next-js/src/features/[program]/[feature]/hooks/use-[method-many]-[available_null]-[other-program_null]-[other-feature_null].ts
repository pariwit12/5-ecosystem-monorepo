import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

// ==>>==>>== Import Keys ==<<==<<==

import {
  // ปรับตามใช้งานจริง
  programFeatureKeys,

  // ปรับตามใช้งานจริง
} from "../[program]-[feature]-keys";

// ==>>==>>== (จบ) Import Keys ==<<==<<==

// ==>>==>>== Import Function (.api) ==<<==<<==

import {
  // ปรับตามใช้งานจริง
  methodManyAvailableOtherProgramOtherFeature,

  // ปรับตามใช้งานจริง
} from "../api/mutations/[method-many]-[available_null]-[other-program_null]-[other-feature_null].api";

// ==>>==>>== (จบ) Import Function (.api) ==<<==<<==

// ปรับตามใช้งานจริง
export const useMethodManyAvailableOtherProgramOtherFeature = () => {
  const queryClient = useQueryClient();

  // เรียกเองได้ (ถ้าเป็น .queries ต้องรับเข้ามา เรียกเองไม่ได้)
  const { getToken, userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      //
      // mutationFn สามารถรับค่ามาได้แค่ 1 ตัวแปร จึงต้องใส่มาเป็น Object

      // ปรับตามใช้งานจริง
      valueOne,

      // ปรับตามใช้งานจริง
      valueTwo,
      valueThree,
      slots,

      // ปรับตามใช้งานจริง
      skipErrorCodes,
    }: {
      // ปรับตามใช้งานจริง
      valueOne: string;

      // ปรับตามใช้งานจริง
      valueTwo: string;
      valueThree: string;
      slots: {
        name: string;
        actual_start_time: string;
        actual_end_time: string;
      }[];

      // ปรับตามใช้งานจริง
      skipErrorCodes?: readonly string[];
    }) => {
      // ปรับตามใช้งานจริง
      const token = await getToken();
      if (!token) throw new Error("Authentication token is missing");

      // ==>>==>>== เรียก API (.api) ==<<==<<==

      // ปรับตามใช้งานจริง
      return methodManyAvailableOtherProgramOtherFeature(
        //
        // ปรับตามใช้งานจริง
        valueOne,

        // ปรับตามใช้งานจริง
        valueTwo,
        valueThree,
        slots,

        // ปรับตามใช้งานจริง
        token,
        skipErrorCodes,
      );

      // ==>>==>>== (จบ) เรียก API (.api) ==<<==<<==
    },

    onSuccess: (
      //
      // ตัวแปรที่ 1 (_) คือ Response จาก API (ใส่ _ แปลว่า API นี้ไม่ได้ยิงอะไรกลับมา)
      // ตัวแปรที่ 2 (variables) คือค่าที่ส่งเข้ามาใน mutationFn

      _,
      variables,
    ) => {
      //
      // ==>>==>>== ล้าง cache ==<<==<<==

      if (
        // ตรวจ ตัวแปรที่ใช้ระบุ cache

        // ปรับตามใช้งานจริง
        userId &&
        variables.valueOne
      ) {
        // ปรับตามใช้งานจริง
        // 1
        queryClient.invalidateQueries({
          // ปรับตามใช้งานจริง
          queryKey: programFeatureKeys.listsByValueOne(
            //
            // ปรับตามใช้งานจริง
            userId,
            variables.valueOne,
          ),
        });
      }

      // ==>>==>>== (จบ) ล้าง cache ==<<==<<==
    },
  });
};
