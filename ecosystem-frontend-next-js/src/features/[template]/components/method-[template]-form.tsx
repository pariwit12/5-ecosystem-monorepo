"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { DateTime } from "luxon";

// ------------- Import Function (useHooks) -------------
import {
  // ปรับตามใช้งานจริง
  useMethodTemplate,

  // ปรับตามใช้งานจริง
} from "../hooks/use-method-[template]";

// ------------- Import Schema (From Backend) -------------
import {
  // ปรับตามใช้งานจริง
  MethodTemplateDtoBodySchema,

  // ปรับตามใช้งานจริง
} from "@backend/modules/[template]/commands/method-[template].command";

// ==========================================
// 🌟 สร้าง Schema + Type สำหรับ Form
// ==========================================

// const MethodTemplateFrontendFormSchema = // ปรับตามใช้งานจริง
//   //
//   // ปรับตามใช้งานจริง
//   MethodTemplateDtoBodySchema.pick({
//     //
//     // ปรับตามใช้งานจริง
//     body_string: true,
//     body_timezone: true,
//     body_string_datetime_start_time: true,
//     body_string_datetime_end_time: true,

//     // ==============================================
//     // กรณีมี field ที่ต้องการเพิ่มเติมจาก backendSchema
//     // ==============================================
//     // }).extend({
//     //   isConfirmed: z.boolean().refine((val) => val === true, {
//     //     message: "คุณต้องยืนยันข้อมูลก่อนบันทึก", // "You must confirm before saving"
//     //   }),
//     //
//   });
const MethodTemplateFrontendFormSchema = // ปรับตามใช้งานจริง
  //
  // ปรับตามใช้งานจริง
  MethodTemplateDtoBodySchema

    // ==============================================
    // กรณีมี field ที่ต้องการเพิ่มเติมจาก backendSchema
    // ==============================================

    .extend({
      start_time: z.string(),

      duration_minute: z.number(),
    });

//
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
    placeTimezone,

    // ปรับตามใช้งานจริง
    urlOnSuccess,
    urlOnCancel,

    // ปรับตามใช้งานจริง
    skipErrorCodes,

    // ปรับตามใช้งานจริง
    className = "",
    //
  }: {
    // ปรับตามใช้งานจริง
    valueOne: string;
    placeTimezone: string;

    // ปรับตามใช้งานจริง
    urlOnSuccess: string;
    urlOnCancel: string;

    // ปรับตามใช้งานจริง
    skipErrorCodes?: string[];

    // ปรับตามใช้งานจริง
    className?: string;
    //
  }) => {
    const router = useRouter();

    const {
      // ปรับตามใช้งานจริง
      mutate: mutateMethodTemplate, // ปรับตามใช้งานจริง
      isPending,

      // ปรับตามใช้งานจริง
    } = useMethodTemplate();

    // ===============
    // ตั้งค่า Form
    // ===============

    const {
      register,
      handleSubmit,
      control,
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
          body_string_datetime_start_time: "",
          body_string_datetime_end_time: "",
          start_time: "",
          duration_minute: 0,
          //
        },
      },
    );

    // ===============
    // (จบ) ตั้งค่า Form
    // ===============

    // ==========================================================
    // 🌟 ฟังก์ชันที่เปลี่ยนแปลงตามค่าใน form (เปลี่ยนแบบ Real-time)
    // ==========================================================

    // ==========================
    // จับตาดูค่า โดย useWatch
    // ==========================

    // Function แสดงเวลาสิ้นสุด (จาก start_time และ duration_minutue)

    const startTimeValue = useWatch({
      control,
      name: "start_time",
    });
    const durationValue = useWatch({
      control,
      name: "duration_minute",
    });

    // ==========================
    // (จบ) จับตาดูค่า โดย useWatch
    // ==========================

    // Function แสดงเวลาสิ้นสุด (จาก start_time และ duration_minutue)

    let endTimeDisplay = null;

    if (startTimeValue && durationValue > 0) {
      const [hours, minutes] = startTimeValue.split(":").map(Number);

      if (!isNaN(hours) && !isNaN(minutes)) {
        // แปลงเป็นนาทีทั้งหมด แล้วบวก duration
        const totalMinutes = hours * 60 + minutes + durationValue;

        // คำนวณชั่วโมงและนาทีกลับ
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;

        // เช็คว่าข้ามวันหรือไม่
        const daysLater = Math.floor(totalMinutes / (24 * 60));

        const formattedTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

        // ข้อความต่อท้าย (กรณีผลลัพธ์ไม่อยู่ในวัน)
        let daySuffix = "";
        if (daysLater === 1) {
          daySuffix = " (ของวันถัดไป)";
        } else if (daysLater > 1) {
          daySuffix = ` (ของ ${daysLater} วันถัดไป)`;
        }

        endTimeDisplay = `เวลาเลิกงาน: ${formattedTime} น.${daySuffix}`;
      }
    }

    // ==========================================================
    // 🌟 (จบ) ฟังก์ชันที่เปลี่ยนแปลงตามค่าใน form (เปลี่ยนแบบ Real-time)
    // ==========================================================

    // ================
    // จัดการผลลัพธ์
    // ================

    const onSubmit = (
      //
      data: MethodTemplateFrontendForm, // ปรับตามใช้งานจริง
      //
    ) => {
      //
      // ==============================================
      // 🌟 จัดการข้อมูลให้เรียบร้อยก่อนส่งต่อให้ use-hooks
      // ==============================================

      // นำ String จาก Input มาประกอบกับ placeTimezone แล้วแปลงเป็น ISO 8601 String (พร้อมส่งต่อ)

      const startIso =
        DateTime.fromISO(data.body_string_datetime_start_time, {
          zone: placeTimezone,
        }).toISO() || "";

      // eslint-disable-next-line
      const endIso =
        DateTime.fromISO(data.body_string_datetime_end_time, {
          zone: placeTimezone,
        }).toISO() || "";

      // ==============================================
      // 🌟 (จบ) จัดการข้อมูลให้เรียบร้อยก่อนส่งต่อให้ use-hooks
      // ==============================================

      // ปรับตามใช้งานจริง
      mutateMethodTemplate(
        {
          // ปรับตามใช้งานจริง
          valueOne: valueOne,

          // ปรับตามใช้งานจริง
          valueTwo: data.body_string,
          valueThree: startIso, // ISO string ที่ผ่านการจัดการแล้ว

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
              // `/template/${valueOne}/client-query`, // ปรับตามใช้งานจริง
              urlOnSuccess, // ปรับตามใช้งานจริง
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
            {/* ปรับตามใช้งานจริง */}
            ชื่อ... <span className="text-red-500">*</span>
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
              <p className="text-sm text-red-500">
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
            {/* ปรับตามใข้งานจริง */}
            เขตเวลา (Timezone) <span className="text-red-500">*</span>
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
              <p className="text-sm text-red-500">
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

        {/* =================== */}
        {/* Datetime Input */}
        {/* =================== */}

        <div className="flex flex-col gap-2">
          <label
            //
            htmlFor="actual_start_time" // ปรับตามใช้งานจริง
            //
            className="text-sm font-bold text-gray-700"
          >
            {/*  */}
            {/* ปรับตามใข้งานจริง */}
            เวลาเริ่มต้น <span className="text-red-500">*</span>
            {/*  */}
          </label>

          <input
            //
            id="actual_start_time" // ปรับตามใข้งานจริง
            //
            type="datetime-local"
            //
            {...register(
              //
              "body_string_datetime_start_time", // ปรับตามใข้งานจริง
              //
            )}
            disabled={isPending}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
              //
              errors.body_string_datetime_start_time // ปรับตามใข้งานจริง
                ? //
                  "border-red-300 focus:ring-red-100 focus:border-red-500"
                : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
            }`}
          />
          {
            //
            errors.body_string_datetime_start_time && ( // ปรับตามใข้งานจริง
              //
              <p className="text-sm text-red-500">
                {
                  //
                  errors.body_string_datetime_start_time.message // ปรับตามใข้งานจริง
                  //
                }
              </p>
            )
          }
        </div>
        <div className="flex flex-col gap-2">
          <label
            //
            htmlFor="actual_end_time" // ปรับตามใข้งานจริง
            //
            className="text-sm font-bold text-gray-700"
          >
            {/*  */}
            {/* ปรับตามใข้งานจริง */}
            เวลาสิ้นสุด <span className="text-red-500">*</span>
            {/*  */}
          </label>

          <input
            //
            id="actual_end_time" // ปรับตามใข้งานจริง
            //
            type="datetime-local"
            //
            {...register(
              //
              "body_string_datetime_end_time", // ปรับตามใข้งานจริง
              //
            )}
            disabled={isPending}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
              //
              errors.body_string_datetime_end_time // ปรับตามใข้งานจริง
                ? //
                  "border-red-300 focus:ring-red-100 focus:border-red-500"
                : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
            }`}
          />
          {
            //
            errors.body_string_datetime_end_time && ( // ปรับตามใข้งานจริง
              //
              <p className="text-sm text-red-500">
                {
                  //
                  errors.body_string_datetime_end_time.message // ปรับตามใข้งานจริง
                  //
                }
              </p>
            )
          }
        </div>

        {/* =================== */}
        {/* (จบ) Datetime Input */}
        {/* =================== */}

        {/* =============== */}
        {/* Time Input */}
        {/* =============== */}

        <div className="flex flex-col gap-2">
          <label
            //
            htmlFor="start_time" // ปรับตามใช้งานจริง
            //
            className="text-sm font-bold text-gray-700"
          >
            {/*  */}
            {/* ปรับตามใข้งานจริง */}
            เวลา... <span className="text-red-500">*</span>
            {/*  */}
          </label>

          <input
            //
            id="start_time" // ปรับตามใช้งานจริง
            //
            type="time"
            //
            {...register(
              //
              "start_time", // ปรับตามใช้งานจริง
              //
            )}
            disabled={isPending}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
              //
              errors.start_time // ปรับตามใข้งานจริง
                ? //
                  "border-red-300 focus:ring-red-100 focus:border-red-500"
                : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
            }`}
          />
          {
            //
            errors.start_time && ( // ปรับตามใช้งานจริง
              //
              <p className="text-sm text-red-500">
                {
                  //
                  errors.start_time.message // ปรับตามใช้งานจริง
                  //
                }
              </p>
            )
          }
        </div>

        {/* =============== */}
        {/* (จบ) Time Input */}
        {/* =============== */}

        {/* ================= */}
        {/* Number Input */}
        {/* ================= */}

        <div className="flex flex-col gap-2">
          <label
            //
            htmlFor="duration_minute" // ปรับตามใช้งานจริง
            //
            className="text-sm font-bold text-gray-700"
          >
            {/*  */}
            {/* ปรับตามใข้งานจริง */}
            ปริมาณ... / ระยะ... (หน่วย) <span className="text-red-500">*</span>
            {/*  */}
          </label>

          <input
            //
            id="duration_minute" // ปรับตามใช้งานจริง
            //
            type="number"
            //
            // ปรับตามใช้งานจริง
            min="1" // ปรับตามใช้งานจริง
            step="1" // ปรับตามใช้งานจริง (default: step="1")
            //
            {...register(
              //
              "duration_minute", // ปรับตามใช้งานจริง
              //
              // ปรับตามใช้งานจริง
              {
                valueAsNumber: true, // บอก HTML ให้แปลงค่าเป็น number ให้เรียบร้อยก่อนส่งให้ react-hook-form
                // default: HTML จะส่งค่าออกไปเป็น string ทั้งหมด
              },
              //
            )}
            //
            placeholder="เช่น ..." // ปรับตามใช้งานจริง
            //
            disabled={isPending}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 focus:ring-2 ${
              //
              errors.duration_minute // ปรับตามใช้งานจริง
                ? //
                  "border-red-300 focus:ring-red-100 focus:border-red-500"
                : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
            }`}
          />

          {
            //
            errors.duration_minute && ( // ปรับตามใช้งานจริง
              //
              <p className="text-sm text-red-500">
                {
                  //
                  errors.duration_minute.message // ปรับตามใช้งานจริง
                  //
                }
              </p>
            )
          }
        </div>

        {/* ================= */}
        {/* (จบ) Number Input */}
        {/* ================= */}

        {/* =============================== */}
        {/* พื้นที่แสดงผลลัพธ์จากค่าใน form */}
        {/* =============================== */}

        {/* // Function แสดงเวลาสิ้นสุด (จาก start_time และ duration_minutue) */}

        <div
          className={`text-sm px-4 py-3 rounded-lg border transition-all ${
            endTimeDisplay
              ? "bg-blue-50 border-blue-100 text-blue-700"
              : "bg-gray-50 border-gray-100 text-gray-400"
          }`}
        >
          {
            endTimeDisplay ||
              "กรุณาระบุเวลาเริ่มต้นและระยะเวลา เพื่อดูเวลาเลิกงาน" // ปรับตามใช้งานจริง
          }
        </div>

        {/* =============================== */}
        {/* (จบ) พื้นที่แสดงผลลัพธ์จากค่าใน form */}
        {/* =============================== */}

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
                // `/template/${valueOne}/server-query`, // ปรับตามใช้งานจริง
                urlOnCancel, // ปรับตามใช้งานจริง
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
