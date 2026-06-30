"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

// ------------- Import Function (useHooks) -------------
import {
  // ปรับตามใช้งานจริง
  useMethodTemplate,

  // ปรับตามใช้งานจริง
} from "@/features/[template]/hooks/use-method-[template]";

// ------------- Import Schema (From Backend) -------------
import {
  // ปรับตามใช้งานจริง
  MethodTemplateDtoBodySchema,

  // ปรับตามใช้งานจริง
} from "@backend/modules/[template]/commands/method-[template].command";

// ==========================================
// 🌟 สร้าง Schema + Type สำหรับ Form
// ==========================================

const MethodTemplateFrontendFormSchema = // ปรับตามใช้งานจริง
  //
  // ปรับตามใช้งานจริง
  MethodTemplateDtoBodySchema.pick({
    //
    // ปรับตามใช้งานจริง
    body_string: true,
    body_timezone: true,

    // ==============================================
    // กรณีมี field ที่ต้องการเพิ่มเติมจาก backendSchema
    // ==============================================
    // }).extend({
    //   isConfirmed: z.boolean().refine((val) => val === true, {
    //     message: "คุณต้องยืนยันข้อมูลก่อนบันทึก", // "You must confirm before saving"
    //   }),
    //
  });
type MethodTemplateFrontendForm = // ปรับตามใช้งานจริง
  z.infer<
    typeof MethodTemplateFrontendFormSchema // ปรับตามใช้งานจริง
  >;

// ==========================================
// 🌟 (จบ) สร้าง Schema + Type สำหรับ Form
// ==========================================

// ======================================
// เตรียมข้อมูล / ฟังก์ชัน สำหรับใช้ใน Form
// ======================================

// Get Timezone data
const allTimezones = Intl.supportedValuesOf("timeZone");
const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// ======================================
// (จบ) เตรียมข้อมูล / ฟังก์ชัน สำหรับใช้ใน Form
// ======================================

// ==========================================
// 🌟 Main
// ==========================================

export const MethodTemplateForm = // ปรับตามใช้งานจริง
  ({
    // ปรับตามใช้งานจริง
    valueOne,

    // ปรับตามใช้งานจริง
    skipErrorCodes,

    // ปรับตามใช้งานจริง
    className = "",
    //
  }: {
    // ปรับตามใช้งานจริง
    valueOne: string;

    // ปรับตามใช้งานจริง
    skipErrorCodes?: string[];

    // ปรับตามใช้งานจริง
    className?: string;
    //
  }) => {
    const router = useRouter();

    const {
      // ปรับตามใช้งานจริง
      mutate: methodTemplate, // ปรับตามใช้งานจริง
      isPending,

      // ปรับตามใช้งานจริง
    } = useMethodTemplate();

    // ===============
    // ตั้งค่า Form
    // ===============

    const {
      register,
      handleSubmit,
      formState: { errors },
      //
    } = useForm<MethodTemplateFrontendForm>( // ปรับตามใช้งานจริง
      //
      {
        resolver: zodResolver(
          //
          MethodTemplateFrontendFormSchema, // ปรับตามใช้งานจริง
          //
        ),
        defaultValues: {
          //
          // ปรับตามใช้งานจริง
          body_string: "",
          body_timezone: defaultTimezone,
          //
        },
      },
    );

    // ===============
    // (จบ) ตั้งค่า Form
    // ===============

    // ================
    // จัดการผลลัพธ์
    // ================

    const onSubmit = (
      //
      data: MethodTemplateFrontendForm, // ปรับตามใช้งานจริง
      //
    ) => {
      //
      // ปรับตามใช้งานจริง
      methodTemplate(
        {
          // ปรับตามใช้งานจริง
          valueOne: valueOne,
          valueTwo: data.body_string,
          valueThree: data.body_timezone,

          // ปรับตามใช้งานจริง
          skipErrorCodes: skipErrorCodes,
          //
        },
        {
          onSuccess: () => {
            //
            // ปรับตามใช้งานจริง
            toast.success(
              //
              "...เรียบร้อยแล้ว", // ปรับตามใช้งานจริง
              //
            );

            // ปรับตามใช้งานจริง
            router.push(
              //
              `/template/${valueOne}/client-query`, // ปรับตามใช้งานจริง
              //
            );
            //
          },
          onError: () => {
            //
            // ปรับตามใช้งานจริง
            toast.error(
              //
              "ไม่สามารถ...ได้ กรุณาลองใหม่อีกครั้ง", // ปรับตามใช้งานจริง
              //
            );
            //
          },
        },
      );
    };

    // ================
    // (จบ) จัดการผลลัพธ์
    // ================

    // ==================
    // ------- UI -------
    // ==================

    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col gap-6 ${className}`}
      >
        {/* ======================= */}
        {/* 🟢 Input Zone */}
        {/* ======================= */}

        {/* ================ */}
        {/* Text Input */}
        {/* ================ */}

        <div className="flex flex-col gap-2">
          <label
            //
            htmlFor="body_string" // ปรับตามใช้งานจริง
            //
            className="text-sm font-bold text-gray-700"
          >
            {/*  */}
            ชื่อ... {/* ปรับตามใช้งานจริง */}
            <span className="text-red-500">*</span> {/* ปรับตามใช้งานจริง */}
            {/*  */}
          </label>
          <input
            //
            id="body_string" // ปรับตามใช้งานจริง
            //
            type="text"
            //
            {...register(
              //
              "body_string", // ปรับตามใช้งานจริง
              //
            )}
            //
            placeholder="เช่น ..." // ปรับตามใช้งานจริง
            //
            disabled={isPending}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 focus:ring-2 ${
              //
              errors.body_string // ปรับตามใช้งานจริง
                ? //
                  "border-red-300 focus:ring-red-100 focus:border-red-500"
                : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
            }`}
          />
          {
            //
            errors.body_string && ( // ปรับตามใช้งานจริง
              //
              <p className="text-sm text-red-500 mt-1">
                {
                  //
                  errors.body_string.message // ปรับตามใช้งานจริง
                  //
                }
              </p>
            )
          }
        </div>

        {/* ================ */}
        {/* (จบ) Text Input */}
        {/* ================ */}

        {/* ==================== */}
        {/* Selector Input */}
        {/* ==================== */}

        <div className="flex flex-col gap-2">
          <label
            //
            htmlFor="timezone" // ปรับตามใข้งานจริง
            //
            className="text-sm font-bold text-gray-700"
          >
            {/*  */}
            เขตเวลา (Timezone) {/* ปรับตามใข้งานจริง */}
            <span className="text-red-500">*</span> {/* ปรับตามใข้งานจริง */}
            {/*  */}
          </label>
          <select
            //
            id="timezone" // ปรับตามใช้งานจริง
            //
            {...register(
              //
              "body_timezone", // ปรับตามใช้งานจริง
              //
            )}
            disabled={isPending}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
              //
              errors.body_timezone // ปรับตามใช้งานจริง
                ? //
                  "border-red-300 focus:ring-red-100 focus:border-red-500"
                : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
            }`}
          >
            {
              //
              allTimezones // ปรับตามใช้งานจริง
                //
                .map(
                  (
                    //
                    tz, // ปรับตามใช้งานจริง
                    //
                  ) => (
                    <option
                      //
                      key={tz} // ปรับตามใช้งานจริง
                      value={tz} // ปรับตามใช้งานจริง
                    >
                      {/*  */}
                      {tz} {/* ปรับตามใช้งานจริง */}
                      {/*  */}
                    </option>
                  ),
                )
            }
          </select>
          {
            //
            errors.body_timezone && ( // ปรับตามใช้งานจริง
              //
              <p className="text-sm text-red-500 mt-1">
                {
                  //
                  errors.body_timezone.message // ปรับตามใช้งานจริง
                  //
                }
              </p>
            )
          }
          <p className="text-xs text-gray-500">
            {/*  */}
            {/* ปรับตามใช้งานจริง */}
            เวลามาตรฐานที่จะถูกใช้ในการคำนวณและแสดงผลตารางกะการทำงาน
            {/*  */}
          </p>
        </div>

        {/* ==================== */}
        {/* (จบ) Selector Input */}
        {/* ==================== */}

        {/* ======================= */}
        {/* 🟢 (จบ) Input Zone */}
        {/* ======================= */}

        {/* ============================ */}
        {/* 🟢 Action Buttons Zone */}
        {/* ============================ */}

        <div className="border-t border-gray-100 pt-6 mt-2 flex justify-end gap-3">
          {/*  */}
          {/* ==================== */}
          {/* Back Button */}
          {/* ==================== */}

          <button
            type="button"
            onClick={() =>
              router.push(
                //
                `/template/${valueOne}/server-query`, // ปรับตามใช้งานจริง
                //
              )
            }
            disabled={isPending}
            className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
          >
            ยกเลิก
          </button>

          {/* ==================== */}
          {/* (จบ) Back Button */}
          {/* ==================== */}

          {/* ==================== */}
          {/* Submit Button */}
          {/* ==================== */}

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {
              isPending
                ? //
                  "กำลังบันทึก..." // ปรับตามใช้งานจริง
                : //
                  "บันทึกข้อมูล" // ปรับตามใช้งานจริง
              //
            }
          </button>

          {/* ==================== */}
          {/* (จบ) Submit Button */}
          {/* ==================== */}
          {/*  */}
        </div>

        {/* ============================ */}
        {/* 🟢 (จบ) Action Buttons Zone */}
        {/* ============================ */}
        {/*  */}
      </form>
    );
  };
