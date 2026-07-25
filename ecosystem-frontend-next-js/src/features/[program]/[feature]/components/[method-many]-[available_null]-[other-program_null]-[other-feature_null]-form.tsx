"use client";

import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { DateTime } from "luxon";

// ==>>==>>== Import Function (useHooks) ==<<==<<==

import {
  // ปรับตามใช้งานจริง
  useMethodManyAvailableOtherProgramOtherFeature,

  // ปรับตามใช้งานจริง
} from "../hooks/use-[method-many]-[available_null]-[other-program_null]-[other-feature_null]";

// ==>>==>>== (จบ) Import Function (useHooks) ==<<==<<==

// ==>>==>>== Import Schema (From Backend) ==<<==<<==

// นำมาใช้สร้าง Schema สำหรับ Form (หากไม่ใช้ก็ลบออกได้เลย)

import {
  // ปรับตามใช้งานจริง
  MethodManyAvailableOtherProgramOtherFeatureDtoBodySchema,

  // ปรับตามใช้งานจริง
} from "@backend/modules/[program]/[feature]/commands/[method-many]-[available_null]-[other-program_null]-[other-feature_null].command";

// ==>>==>>== (จบ) Import Schema (From Backend) ==<<==<<==

// ==>>==>>== Import UI ==<<==<<==

import { Calendar } from "@/components/ui/calendar";

// ==>>==>>== (จบ) Import UI ==<<==<<==

// ==>>==>>== สร้าง Schema สำหรับ Form ==<<==<<==

// ==>>==>>== แบบที่ 1: ใช้ = DtoBodySchema (ดีที่สุด) ==<<==<<==

const FrontendFormSchema =
  //
  // ปรับตามใช้งานจริง
  MethodManyAvailableOtherProgramOtherFeatureDtoBodySchema

    // ==>>==>>== กรณีมี field เพิ่มเติม ==<<==<<==

    .extend({
      // ปรับตามใช้งานจริง

      start_time: z.string(),

      duration_minute: z.number(),

      dates: z
        .array(
          // ใช้ z.date() แทน z.string() เพราะ calendar ของ shadcn จะส่งค่ามาให้เป็น date
          z.date({
            message: "dates ต้องเป็น type: date เท่านั้น",
          }),
        )
        .min(1, "กรุณาเลือกวันที่อย่างน้อย 1 วัน"),
      // เช่น [new Date("2026-07-01"), new Date("2026-07-03")] (array ของ ค่าวันที่ที่ผู้ใช้เลือกจากปฏิทิน (เป็น JS Date Object))
    });

// ==>>==>>== (จบ) กรณีมี field เพิ่มเติม ==<<==<<==

// ==>>==>>== (จบ) แบบที่ 1: ใช้ = DtoBodySchema (ดีที่สุด) ==<<==<<==

// ==>>==>>== แบบที่ 2: ใช้ pick (กรณี Backend มีบาง field ที่ Form ไม่ได้ใช้) ==<<==<<==

// const FrontendFormSchema =
//   //
//   // ปรับตามใช้งานจริง
//   MethodManyAvailableOtherProgramOtherFeatureDtoBodySchema.pick({
//     //
//     // ปรับตามใช้งานจริง
//     body_string: true,
//     body_timezone: true,
//     body_string_datetime_start_time: true,
//     body_string_datetime_end_time: true,
//   })

//     // ==>>==>>== กรณีมี field เพิ่มเติม ==<<==<<==

//     .extend({
//       isConfirmed: z.boolean().refine((val) => val === true, {
//         message: "คุณต้องยืนยันข้อมูลก่อนบันทึก", // "You must confirm before saving"
//       }),
//     });

// ==>>==>>== (จบ) กรณีมี field เพิ่มเติม ==<<==<<==

// ==>>==>>== (จบ) แบบที่ 2: ใช้ pick (กรณี Backend มีบาง field ที่ Form ไม่ได้ใช้) ==<<==<<==

// ==>>==>>== แบบที่ 3: เขียนใหม่ (กรณี Backend และ Form ไม่มี field ที่ใช้ร่วมกัน) ==<<==<<==

// const FrontendFormSchema = z.object({
//   //
//   // ปรับตามใช้งานจริง
//   // ใช้ snippet จาก METHOD DtoBodySchema
// });

// ==>>==>>== (จบ) แบบที่ 3: เขียนใหม่ (กรณี Backend และ Form ไม่มี field ที่ใช้ร่วมกัน) ==<<==<<==

// ==>>==>>== (จบ) สร้าง Schema สำหรับ Form ==<<==<<==

// ==>>==>>== สร้าง Type สำหรับ Form ==<<==<<==

type FrontendForm = z.infer<typeof FrontendFormSchema>;

// ==>>==>>== (จบ) สร้าง Type สำหรับ Form ==<<==<<==

// ==>>==>>== เตรียมข้อมูล / ฟังก์ชัน สำหรับใช้ใน Form ==<<==<<==

// ปรับตามใช้งานจริง

// ดึงข้อมูล Timezone ทั้งหมด จาก browser?
const allTimezones = Intl.supportedValuesOf("timeZone");
// ดึงข้อมูล Timezone ที่ใช้อยู่ จาก browser?
const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// ==>>==>>== (จบ) เตรียมข้อมูล / ฟังก์ชัน สำหรับใช้ใน Form ==<<==<<==

// ปรับตามใช้งานจริง
export const MethodManyAvailableOtherProgramOtherFeatureForm = ({
  //
  // ปรับตามใช้งานจริง
  valueOne,
  placeTimezone,

  // ปรับตามใช้งานจริง
  prefillName,
  prefillStartTime,
  prefillDurationMinute,

  // ปรับตามใช้งานจริง
  urlOnSuccess,
  urlOnCancel,

  // ปรับตามใช้งานจริง
  skipErrorCodes,
}: {
  // ปรับตามใช้งานจริง
  valueOne: string;
  placeTimezone: string;

  // ปรับตามใช้งานจริง
  prefillName?: string;
  prefillStartTime?: string;
  prefillDurationMinute?: number;

  // ปรับตามใช้งานจริง
  urlOnSuccess: string;
  urlOnCancel: string;

  // ปรับตามใช้งานจริง
  skipErrorCodes?: readonly string[];
}) => {
  const router = useRouter();

  const {
    // ปรับตามใช้งานจริง
    mutate: mutateMethodManyAvailableOtherProgramOtherFeature,
    isPending,

    // ปรับตามใช้งานจริง
  } = useMethodManyAvailableOtherProgramOtherFeature();

  // ==>>==>>== ตั้งค่า Form ==<<==<<==

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FrontendForm>({
    resolver: zodResolver(FrontendFormSchema),
    defaultValues: {
      //
      // ปรับตามใช้งานจริง
      dates: [], // ตัวอย่างข้อมูล: [new Date("2026-07-01"), new Date("2026-07-03")] (array ของ ค่าวันที่ที่ผู้ใช้เลือกจากปฏิทิน (เป็น JS Date Object))
      body_string: prefillName || "",
      body_timezone: defaultTimezone,
      body_string_datetime_start_time: "",
      body_string_datetime_end_time: "",
      start_time: prefillStartTime || "",
      duration_minute: prefillDurationMinute || 0,
    },
  });

  // ==>>==>>== (จบ) ตั้งค่า Form ==<<==<<==

  // ==>>==>>== 🌟 ฟังก์ชันที่เปลี่ยนแปลงตามค่าใน form (เปลี่ยนแบบ Real-time) ==<<==<<==

  // ==>>==>>== จับตาดูค่า โดย useWatch ==<<==<<==

  const startTimeValue = useWatch({
    control,
    name: "start_time",
  });

  const durationValue = useWatch({
    control,
    name: "duration_minute",
  });

  // ==>>==>>== (จบ) จับตาดูค่า โดย useWatch ==<<==<<==

  // ==>>==>>== Function: แสดงเวลาสิ้นสุด (จาก start_time และ duration_minutue) ==<<==<<==

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

  // ==>>==>>== (จบ) Function: แสดงเวลาสิ้นสุด (จาก start_time และ duration_minutue) ==<<==<<==

  // ==>>==>>== (จบ) 🌟 ฟังก์ชันที่เปลี่ยนแปลงตามค่าใน form (เปลี่ยนแบบ Real-time) ==<<==<<==

  // ==>>==>>== Function หลัก ==<<==<<==

  const onSubmit = (data: FrontendForm) => {
    //
    // ==>>==>>== จัดการข้อมูลให้เรียบร้อยก่อนส่งต่อให้ use-hooks ==<<==<<==

    // Function: ประกอบร่าง dateObject แล้วแปลงเป็น ISO 8601 String สำหรับส่งต่อ

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

    // (จบ) Function: ประกอบร่าง dateObject แล้วแปลงเป็น ISO 8601 String สำหรับส่งต่อ

    // Function: แปลงหน้าตาข้อมูลให้เป็นรูปแบบเดียวกับ Backend

    // ==== กรณีข้อมูลที่รับไม่เหมือน Backend DTO ====
    // แปลงข้อมูลให้เป็นรูปแบบที่ backend จะใช้ใน Method ต่อให้เรียบร้อย ***ในไฟล์ form เลย***

    const slotsPayload: {
      name: string;
      actual_start_time: string;
      actual_end_time: string;
    }[] = [];

    // data.dates ตอนนี้เป็น Array ของ Date Object (เพราะเราใช้ Calendar จาก shadcn)
    for (const dateObj of data.dates) {
      // แปลง Date object ของ JS ให้เป็น String "YYYY-MM-DD" ก่อน
      const dateString = DateTime.fromJSDate(dateObj).toFormat("yyyy-MM-dd");

      // ประกอบร่าง วันที่ + เวลา โดยอ้างอิง Timezone
      const startDt = DateTime.fromFormat(
        `${dateString} ${data.start_time}`,
        "yyyy-MM-dd HH:mm",
        {
          zone: placeTimezone,
        },
      );

      // คำนวณเวลาจบ
      const endDt = startDt.plus({ minutes: data.duration_minute });

      // แปลงเป็น ISO string เพื่อส่งไป Backend
      const actual_start_time = startDt.toISO()!;
      const actual_end_time = endDt.toISO()!;

      for (let i = 0; i < data.body_int; i++) {
        slotsPayload.push({
          name: data.body_string,
          actual_start_time,
          actual_end_time,
        });
      }
    }

    // (จบ) Function: แปลงหน้าตาข้อมูลให้เป็นรูปแบบเดียวกับ Backend

    // ==>>==>>== (จบ) จัดการข้อมูลให้เรียบร้อยก่อนส่งต่อให้ use-hooks ==<<==<<==

    // ปรับตามใช้งานจริง
    mutateMethodManyAvailableOtherProgramOtherFeature(
      {
        // ปรับตามใช้งานจริง
        valueOne: valueOne,

        // ปรับตามใช้งานจริง
        valueTwo: data.body_string,
        valueThree: startIso, // ISO string ที่ผ่านการจัดการแล้ว
        slots: slotsPayload,

        // ปรับตามใช้งานจริง
        skipErrorCodes: skipErrorCodes,
      },
      {
        onSuccess: () => {
          // ปรับตามใช้งานจริง
          toast.success(
            // ปรับตามใช้งานจริง
            "...เรียบร้อยแล้ว",
          );

          // ปรับตามใช้งานจริง
          router.push(
            // ปรับตามใช้งานจริง
            // `/template/${valueOne}/client-query`,
            urlOnSuccess,
          );
        },
        onError: () => {
          // ปรับตามใช้งานจริง
          toast.error(
            // ปรับตามใช้งานจริง
            "ไม่สามารถ...ได้ กรุณาลองใหม่อีกครั้ง",
          );
        },
      },
    );
  };

  // ==>>==>>== (จบ) Function หลัก ==<<==<<==

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col gap-6`}
    >
      {/* ======================= */}
      {/* 🟢 Input Zone */}
      {/* ======================= */}

      {/* ==================================== */}
      {/* Input: Calendar (แบบเลือกหลายวัน) */}
      {/* ==================================== */}

      <div className="flex flex-col gap-2">
        <label htmlFor="dates" className="text-sm font-bold text-gray-700">
          เลือกวันที่ต้องการสร้างเวร <span className="text-red-500">*</span>
        </label>

        {/* 🌟 พระเอกของเรา Controller + shadcn Calendar */}
        <Controller
          control={control}
          name="dates"
          render={({ field }) => (
            <Calendar
              mode="multiple" // สั่งให้เลือกได้หลายวัน
              selected={field.value} // ค่าจาก Form
              onSelect={field.onChange} // ส่งค่ากลับไป Form
              disabled={isPending}
              className="bg-white rounded-md border shadow-sm
                max-w-150
                portrait:w-full
                landscape:w-[100vh] 
              "
            />

            // // 🌟 ครอบด้วย div และดักจับจังหวะที่นิ้วเริ่มจิ้ม (onPointerDown)
            // // เพื่อสั่งเบราว์เซอร์ว่า "ไม่ต้องเตะโฟกัสออกจาก Input ตัวเดิมชั่วคราว"
            // // ทำให้คีย์บอร์ดไม่หุบลงมาขัดจังหวะ และหน้าจอจะไม่ขยับเลยแม้แต่พิกเซลเดียวครับ

            // <div
            //   className="w-full max-w-150"
            //   // onPointerDown={(e) => {
            //   //   const target = e.target as HTMLElement;
            //   //   // ถ้าจุดที่นิ้วจิ้มโดน เป็นปุ่มในปฏิทิน ให้บล็อกการเปลี่ยนสถานะโฟกัสของเบราว์เซอร์ไว้
            //   //   if (target.closest(".rdp") || target.tagName === "BUTTON") {
            //   //     e.preventDefault();
            //   //   }
            //   // }}
            //   // // 🛡️ ชั้นที่ 1: เคลียร์คีย์บอร์ด (ลดปัญหา Layout Shift)
            //   // onTouchStart={() => {
            //   //   // ถ้าผู้ใช้เพิ่งพิมพ์ช่องอื่นเสร็จ (คีย์บอร์ดเปิดอยู่) แล้วเอานิ้วมาแตะปฏิทิน
            //   //   // ให้สั่งเคลียร์ Focus (หุบคีย์บอร์ด) ทันที ก่อนที่ปฏิทินจะเริ่มทำงาน
            //   //   const activeEl = document.activeElement;
            //   //   if (
            //   //     activeEl instanceof HTMLInputElement ||
            //   //     activeEl instanceof HTMLTextAreaElement
            //   //   ) {
            //   //     activeEl.blur();
            //   //   }
            //   // }}
            //   // // 🛡️ ชั้นที่ 2: ป้องกันการดึง Focus จากเมาส์/การสัมผัสเบื้องต้น
            //   // onMouseDown={(e) => {
            //   //   // การใช้ preventDefault ใน onMouseDown จะช่วยห้ามไม่ให้ปุ่มดึง Focus
            //   //   // ข้อดีคือ "มันไม่ขัดขวางการทำงานของ onClick" ปฏิทินจึงยังกดได้ปกติ
            //   //   e.preventDefault();
            //   // }}
            //   // // 🛡️ ชั้นที่ 3: ดักจับและทำลาย Focus อัตโนมัติ (ไม้ตายสำหรับ iOS PWA)
            //   // onFocusCapture={(e) => {
            //   //   const target = e.target as HTMLElement;
            //   //   // ห้องสมุด react-day-picker มักจะแอบเขียนโค้ดสั่ง .focus() อัตโนมัติเวลาเรากดเลือกวัน
            //   //   // ซึ่งตัวนี้แหละคือ "ตัวการหลัก" ที่ทำให้ iOS PWA ตกใจแล้วเลื่อนหน้าจอ
            //   //   // เราจึงใช้ onFocusCapture ดักจับว่า "ถ้าปุ่มในปฏิทินกำลังจะโดน Focus ให้เตะมันออกทันที"
            //   //   if (target.tagName === "BUTTON" || target.closest(".rdp")) {
            //   //     target.blur(); // เตะ focus ออกก่อนที่ iOS Safari จะทันได้เลื่อนหน้าจอ!
            //   //   }
            //   // }}
            // >
            //   <Calendar
            //     mode="multiple"
            //     selected={field.value}
            //     onSelect={field.onChange} // ใช้ของเดิมตามปกติได้เลย ไม่ต้องใส่ window.scrollTo แล้ว
            //     disabled={isPending}
            //     className="bg-white rounded-md border shadow-sm w-full portrait:w-full landscape:w-[100vh]"
            //   />
            // </div>

            // /*
            //     🌟 เทคนิคที่ 1: ดักจับการแตะใน PWA เพื่อเคลียร์คีย์บอร์ดที่ค้างอยู่ด้านบนออกก่อน
            //     ช่วยป้องกันไม่ให้หน้าจอเด้งจากการที่คีย์บอร์ดมือถือหุบตัวกะทันหันครับ
            //   */

            // <div
            //   className="w-full max-w-150"
            //   onTouchStart={() => {
            //     if (document.activeElement instanceof HTMLElement) {
            //       document.activeElement.blur();
            //     }
            //   }}
            // >
            //   <Calendar
            //     mode="multiple"
            //     selected={field.value}
            //     onSelect={field.onChange}
            //     disabled={isPending}
            //     className="bg-white rounded-md border shadow-sm
            //         w-full portrait:w-full landscape:w-[100vh]
            //       "
            //     /*
            //         🌟 เทคนิคที่ 2: เปลี่ยนจาก <button> เป็น <div> (ตรงตามที่คุณคิดไว้เลย)
            //         วิธีนี้จะทำลายกลไก Auto-Focus Scroll ของ iOS Safari ทิ้งไปเลย
            //         เพราะมันจะมองว่าปฏิทินนี้เป็น Layout ปกติ ไม่ใช่ปุ่มกดในฟอร์มครับ
            //       */
            //     components={{
            //       Button: ({ type, ...props }) => (
            //         <div
            //           {...props}
            //           role="button" // ใส่เพื่อให้ยังเข้าถึงได้ตามหลัก Accessibility
            //           className={`${props.className} cursor-pointer`}
            //         />
            //       ),
            //     }}
            //   />
            // </div>

            // <Calendar
            //   mode="multiple" // สั่งให้เลือกได้หลายวัน
            //   selected={field.value} // ค่าจาก Form
            //   // onSelect={field.onChange} // ส่งค่ากลับไป Form
            //   // 🌟 แก้ไขตรง onSelect เพื่อล็อคหน้าจอไม่ให้เด้ง
            //   onSelect={(selectedDates) => {
            //     // 1. จำตำแหน่ง Scroll ปัจจุบันของหน้าจอไว้
            //     const currentScrollY = window.scrollY;

            //     // 2. อัปเดตค่าวันที่ให้ React Hook Form ตามปกติ
            //     field.onChange(selectedDates);

            //     // 3. บังคับหน้าจอกลับมาที่เดิมทันที (behavior: 'instant' จะทำให้ไม่เห็นอาการกระตุก)
            //     requestAnimationFrame(() => {
            //       window.scrollTo({
            //         top: currentScrollY,
            //         behavior: "instant",
            //       });
            //     });
            //   }}
            //   disabled={isPending}
            //   className="bg-white rounded-md border shadow-sm
            //     max-w-150
            //     portrait:w-full
            //     landscape:w-[100vh]
            //   "
            // />
          )}
        />
        {errors.dates && (
          <p className="text-sm text-red-500 mt-1">{errors.dates.message}</p>
        )}
      </div>

      {/* ==================================== */}
      {/* (จบ) Input: Calendar (แบบเลือกหลายวัน) */}
      {/* ==================================== */}

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
