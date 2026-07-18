"use client";

import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { DateTime } from "luxon";

import { useCreateWorkScheduleSlot } from "../hooks/use-create-work-schedule-slot";

import { Calendar } from "@/components/ui/calendar";

// ===============================================================
// 🌟 สร้าง Schema + Type สำหรับ Form (อาจไม่เหมือน Backend DTO)
// ===============================================================

const CreateWorkScheduleSlotFrontendFormSchema = z.object({
  name: z
    .string({
      message: "ชื่อ Slot ต้องเป็น type: string เท่านั้น",
    })
    .trim()
    .min(1, "กรุณาระบุชื่อ Slot (ห้ามเป็นค่าว่าง)"),

  dates: z
    .array(
      // ใช้ z.date() แทน z.string() เพราะ calendar ของ shadcn จะส่งค่ามาให้เป็น date
      z.date({
        message: "dates ต้องเป็น type: date เท่านั้น",
      }),
    )
    .min(1, "กรุณาเลือกวันที่อย่างน้อย 1 วัน"),
  // เช่น [new Date("2026-07-01"), new Date("2026-07-03")] (array ของ ค่าวันที่ที่ผู้ใช้เลือกจากปฏิทิน (เป็น JS Date Object))

  start_time: z
    .string({
      message: "startTime ต้องเป็น type: string เท่านั้น",
    })
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "รูปแบบเวลาไม่ถูกต้อง กรุณาใช้รูปแบบ HH:mm (เช่น 08:00, 20:30)",
    ), // เช่น "08:00"

  duration_minute: z
    .number({
      message: "ระยะเวลาต้องเป็น type: number เท่านั้น",
    })
    .int({
      message: "ระยะเวลาต้องเป็น จำนวนเต็มบวก เท่านั้น",
    })
    .min(1, "ระยะเวลาต้องไม่ต่ำกว่า 1 นาที"),

  quantity: z
    .number({
      message: "จำนวนตำแหน่งต้องเป็น type: number เท่านั้น",
    })
    .int({
      message: "จำนวนตำแหน่งต้องเป็น จำนวนเต็มบวก เท่านั้น",
    })
    .min(1, "จำนวนตำแหน่งต้องไม่ต่ำกว่า 1"),
});
type CreateWorkScheduleSlotFrontendForm = z.infer<
  typeof CreateWorkScheduleSlotFrontendFormSchema
>;

// ===============================================================
// 🌟 (จบ) สร้าง Schema + Type สำหรับ Form (อาจไม่เหมือน Backend DTO)
// ===============================================================

// ==========================================
// 🌟 Main
// ==========================================

export const CreateWorkScheduleSlotForm = ({
  positionId,
  placeTimezone,

  prefillName,
  prefillStartTime,
  prefillDurationMinute,
  prefillQuantity,

  urlOnSuccess,
  urlOnCancel,

  skipErrorCodes,

  className = "",
}: {
  positionId: string;
  placeTimezone: string;

  prefillName?: string;
  prefillStartTime?: string;
  prefillDurationMinute?: number;
  prefillQuantity?: number;

  urlOnSuccess: string;
  urlOnCancel: string;

  skipErrorCodes?: string[];

  className?: string;
}) => {
  const router = useRouter();

  const { mutate: mutateCreateWorkScheduleSlot, isPending } =
    useCreateWorkScheduleSlot();

  // ===============
  // ตั้งค่า Form
  // ===============

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateWorkScheduleSlotFrontendForm>({
    resolver: zodResolver(CreateWorkScheduleSlotFrontendFormSchema),
    defaultValues: {
      name: prefillName || "",
      dates: [], // ตัวอย่างข้อมูล: [new Date("2026-07-01"), new Date("2026-07-03")] (array ของ ค่าวันที่ที่ผู้ใช้เลือกจากปฏิทิน (เป็น JS Date Object))
      start_time: prefillStartTime || "",
      duration_minute: prefillDurationMinute || 0,
      quantity: prefillQuantity || 1,
    },
  });

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

  const onSubmit = (data: CreateWorkScheduleSlotFrontendForm) => {
    //
    // ==============================================
    // 🌟 จัดการข้อมูลให้เรียบร้อยก่อนส่งต่อให้ use-hooks
    // ==============================================

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

      for (let i = 0; i < data.quantity; i++) {
        slotsPayload.push({
          name: data.name,
          actual_start_time,
          actual_end_time,
        });
      }
    }

    // ==============================================
    // 🌟 (จบ) จัดการข้อมูลให้เรียบร้อยก่อนส่งต่อให้ use-hooks
    // ==============================================

    mutateCreateWorkScheduleSlot(
      {
        positionId: positionId,
        slots: slotsPayload,
        skipErrorCodes: skipErrorCodes,
      },
      {
        onSuccess: () => {
          toast.success("สร้าง workScheduleSlot เรียบร้อยแล้ว");
          router.push(urlOnSuccess);
        },
        onError: () => {
          toast.error(
            "ไม่สามารถสร้าง workScheduleSlot ได้ กรุณาลองใหม่อีกครั้ง",
          );
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
        <label htmlFor="name" className="text-sm font-bold text-gray-700">
          ชื่อ <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          placeholder="เช่น เวรเช้า"
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 focus:ring-2 ${
            errors.name
              ? "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* ================ */}
      {/* (จบ) Text Input */}
      {/* ================ */}

      {/* =============== */}
      {/* Time Input */}
      {/* =============== */}

      <div className="flex flex-col gap-2">
        <label htmlFor="start_time" className="text-sm font-bold text-gray-700">
          เวลาเริ่มงาน <span className="text-red-500">*</span>
        </label>
        <input
          id="start_time"
          type="time"
          {...register("start_time")}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
            errors.start_time
              ? "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />
        {errors.start_time && (
          <p className="text-sm text-red-500">{errors.start_time.message}</p>
        )}
      </div>

      {/* =============== */}
      {/* (จบ) Time Input */}
      {/* =============== */}

      {/* ================= */}
      {/* Number Input */}
      {/* ================= */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="duration_minute"
          className="text-sm font-bold text-gray-700"
        >
          ระยะเวลา (นาที) <span className="text-red-500">*</span>
        </label>

        <input
          id="duration_minute"
          type="number"
          min="1"
          {...register(
            "duration_minute",

            {
              valueAsNumber: true,
            },
          )}
          placeholder="กรุณาระบุระยะเวลา"
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 focus:ring-2 ${
            errors.duration_minute
              ? "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />

        {errors.duration_minute && (
          <p className="text-sm text-red-500">
            {errors.duration_minute.message}
          </p>
        )}
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
        {endTimeDisplay ||
          "กรุณาระบุเวลาเริ่มต้นและระยะเวลา เพื่อดูเวลาเลิกงาน"}
      </div>

      {/* =============================== */}
      {/* (จบ) พื้นที่แสดงผลลัพธ์จากค่าใน form */}
      {/* =============================== */}

      {/* ================= */}
      {/* Number Input */}
      {/* ================= */}

      <div className="flex flex-col gap-2">
        <label htmlFor="quantity" className="text-sm font-bold text-gray-700">
          จำนวนที่จะสร้าง (หน่วย) <span className="text-red-500">*</span>
        </label>

        <input
          id="quantity"
          type="number"
          min="1"
          {...register(
            "quantity",

            {
              valueAsNumber: true,
            },
          )}
          placeholder="กรุณาระบุจำนวนที่จะสร้าง"
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 focus:ring-2 ${
            errors.quantity
              ? "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />

        {errors.quantity && (
          <p className="text-sm text-red-500">{errors.quantity.message}</p>
        )}
      </div>

      {/* ================= */}
      {/* (จบ) Number Input */}
      {/* ================= */}

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
            // // 🌟 ครอบด้วย div และดักจับจังหวะที่นิ้วเริ่มจิ้ม (onPointerDown)
            // // เพื่อสั่งเบราว์เซอร์ว่า "ไม่ต้องเตะโฟกัสออกจาก Input ตัวเดิมชั่วคราว"
            // // ทำให้คีย์บอร์ดไม่หุบลงมาขัดจังหวะ และหน้าจอจะไม่ขยับเลยแม้แต่พิกเซลเดียวครับ

            <div
              className="w-full max-w-150"
              onPointerDown={(e) => {
                const target = e.target as HTMLElement;
                // ถ้าจุดที่นิ้วจิ้มโดน เป็นปุ่มในปฏิทิน ให้บล็อกการเปลี่ยนสถานะโฟกัสของเบราว์เซอร์ไว้
                if (target.closest(".rdp") || target.tagName === "BUTTON") {
                  e.preventDefault();
                }
              }}
              // 🛡️ ชั้นที่ 1: เคลียร์คีย์บอร์ด (ลดปัญหา Layout Shift)
              onTouchStart={() => {
                // ถ้าผู้ใช้เพิ่งพิมพ์ช่องอื่นเสร็จ (คีย์บอร์ดเปิดอยู่) แล้วเอานิ้วมาแตะปฏิทิน
                // ให้สั่งเคลียร์ Focus (หุบคีย์บอร์ด) ทันที ก่อนที่ปฏิทินจะเริ่มทำงาน
                const activeEl = document.activeElement;
                if (
                  activeEl instanceof HTMLInputElement ||
                  activeEl instanceof HTMLTextAreaElement
                ) {
                  activeEl.blur();
                }
              }}
              // 🛡️ ชั้นที่ 2: ป้องกันการดึง Focus จากเมาส์/การสัมผัสเบื้องต้น
              onMouseDown={(e) => {
                // การใช้ preventDefault ใน onMouseDown จะช่วยห้ามไม่ให้ปุ่มดึง Focus
                // ข้อดีคือ "มันไม่ขัดขวางการทำงานของ onClick" ปฏิทินจึงยังกดได้ปกติ
                e.preventDefault();
              }}
              // 🛡️ ชั้นที่ 3: ดักจับและทำลาย Focus อัตโนมัติ (ไม้ตายสำหรับ iOS PWA)
              onFocusCapture={(e) => {
                const target = e.target as HTMLElement;
                // ห้องสมุด react-day-picker มักจะแอบเขียนโค้ดสั่ง .focus() อัตโนมัติเวลาเรากดเลือกวัน
                // ซึ่งตัวนี้แหละคือ "ตัวการหลัก" ที่ทำให้ iOS PWA ตกใจแล้วเลื่อนหน้าจอ
                // เราจึงใช้ onFocusCapture ดักจับว่า "ถ้าปุ่มในปฏิทินกำลังจะโดน Focus ให้เตะมันออกทันที"
                if (target.tagName === "BUTTON" || target.closest(".rdp")) {
                  target.blur(); // เตะ focus ออกก่อนที่ iOS Safari จะทันได้เลื่อนหน้าจอ!
                }
              }}
            >
              <Calendar
                mode="multiple"
                selected={field.value}
                onSelect={field.onChange} // ใช้ของเดิมตามปกติได้เลย ไม่ต้องใส่ window.scrollTo แล้ว
                disabled={isPending}
                className="bg-white rounded-md border shadow-sm w-full portrait:w-full landscape:w-[100vh]"
              />
            </div>

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
          onClick={() => router.push(urlOnCancel)}
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
          {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
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
