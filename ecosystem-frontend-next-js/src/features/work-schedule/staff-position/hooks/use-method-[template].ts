import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

// ---------- Import Keys ----------
import {
  // ปรับตามใช้งานจริง
  templateKeys,

  // ปรับตามใช้งานจริง
} from "../work-schedule-staff-position-keys";

// ---------- Import Function (.api) ----------
import {
  // ปรับตามใช้งานจริง
  methodTemplate,

  // ปรับตามใช้งานจริง
} from "../api/mutations/method-[template].api";

export const useMethodTemplate = // ปรับตามใช้งานจริง
  () => {
    const queryClient = useQueryClient();
    const { getToken, userId } = useAuth(); // เรียกเองได้ (ถ้าเป็น .queries ต้องรับเข้ามา เรียกเองไม่ได้)

    return useMutation({
      mutationFn: async ({
        //
        // mutationFn สามารถรับค่ามาได้แค่ 1 ตัวแปร จึงต้องใส่มาเป็น Object

        // ปรับตามใช้งานจริง
        valueOne,
        valueTwo,
        valueThree,
        slots,
        skipErrorCodes,
        //
      }: {
        //
        // ปรับตามใช้งานจริง
        valueOne: string;
        valueTwo: string;
        valueThree: string;
        slots: {
          name: string;
          actual_start_time: string;
          actual_end_time: string;
        }[];
        skipErrorCodes?: string[];
        //
      }) => {
        //
        // ปรับตามใช้งานจริง
        const token = await getToken();
        if (!token) throw new Error("Authentication token is missing");

        // ปรับตามใช้งานจริง
        return methodTemplate(
          //
          // ปรับตามใช้งานจริง
          valueOne,
          valueTwo,
          valueThree,
          slots,
          token,
          skipErrorCodes,
          //
        );
      },

      onSuccess: (
        //
        // ตัวแปรที่ 1 (_) คือ Response จาก API (ใส่ _ แปลว่า API นี้ไม่ได้ยิงอะไรกลับมา)
        // ตัวแปรที่ 2 (variables) คือค่าที่ส่งเข้ามาใน mutationFn

        _,
        variables,
        //
      ) => {
        //
        // ===============
        // ล้าง cache
        // ===============

        if (
          //
          // ตัวแปรที่ใช้ระบุ cache

          // ปรับตามใช้งานจริง
          userId &&
          variables.valueOne
          //
        ) {
          queryClient.invalidateQueries({
            //
            queryKey: templateKeys // ปรับตามใช้งานจริง
              //
              // ปรับตามใช้งานจริง
              .listsByValueOne(
                //
                // ปรับตามใช้งานจริง
                userId,
                variables.valueOne,
                //
              ),
          });
        }

        // ===============
        // (จบ) ล้าง cache
        // ===============
        //
      },
    });
  };
