"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateWorkScheduleSlotTemplate } from "../hooks/use-create-work-schedule-slot-template";

import { CreateWorkScheduleSlotTemplateDtoBodySchema } from "@backend/modules/work-schedule/slot-template/commands/create-work-schedule-slot-template.command";

// ==========================================
// 🌟 สร้าง Schema + Type สำหรับ Form
// ==========================================

const CreateWorkScheduleSlotTemplateFrontendFormSchema =
  CreateWorkScheduleSlotTemplateDtoBodySchema;

type CreateWorkScheduleSlotTemplateFrontendForm = z.infer<
  typeof CreateWorkScheduleSlotTemplateFrontendFormSchema
>;

// ==========================================
// 🌟 (จบ) สร้าง Schema + Type สำหรับ Form
// ==========================================

// ==========================================
// 🌟 Main
// ==========================================

export const CreateWorkScheduleSlotTemplateForm = ({
  positionId,

  urlOnSuccess,
  urlOnCancel,

  skipErrorCodes,

  className = "",
}: {
  positionId: string;

  urlOnSuccess: string;
  urlOnCancel: string;

  skipErrorCodes?: string[];

  className?: string;
}) => {
  const router = useRouter();

  const { mutate: mutateCreateWorkScheduleSlotTemplate, isPending } =
    useCreateWorkScheduleSlotTemplate();

  // ===============
  // ตั้งค่า Form
  // ===============

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateWorkScheduleSlotTemplateFrontendForm>({
    resolver: zodResolver(CreateWorkScheduleSlotTemplateFrontendFormSchema),
    defaultValues: {
      name: "",
      start_time: "", // ปรับตามใช้งานจริง
      duration_minute: 0,
      quantity: 1,
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

  const onSubmit = (data: CreateWorkScheduleSlotTemplateFrontendForm) => {
    //
    // ==============================================
    // 🌟 จัดการข้อมูลให้เรียบร้อยก่อนส่งต่อให้ use-hooks
    // ==============================================

    // ==============================================
    // 🌟 (จบ) จัดการข้อมูลให้เรียบร้อยก่อนส่งต่อให้ use-hooks
    // ==============================================

    mutateCreateWorkScheduleSlotTemplate(
      {
        positionId: positionId,

        name: data.name,
        startTime: data.start_time,
        durationMinute: data.duration_minute,
        quantity: data.quantity,

        skipErrorCodes: skipErrorCodes,
      },
      {
        onSuccess: () => {
          toast.success("สร้าง slotTemplate เรียบร้อยแล้ว");

          router.push(urlOnSuccess);
        },
        onError: () => {
          toast.error("ไม่สามารถสร้าง slotTemplate ได้ กรุณาลองใหม่อีกครั้ง");
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
          ชื่อ slotTemplate
          <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          placeholder="เช่น เวรเช้า (M), กะเปิดร้าน, เวรดึก"
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
        <label
          //
          htmlFor="start_time"
          //
          className="text-sm font-bold text-gray-700"
        >
          เวลาเริ่มงาน
          <span className="text-red-500">*</span>
        </label>
        <input
          //
          id="start_time"
          //
          type="time"
          //
          {...register(
            //
            "start_time",
            //
          )}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
            //
            errors.start_time
              ? //
                "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />
        {
          //
          errors.start_time && (
            //
            <p className="text-sm text-red-500">
              {
                //
                errors.start_time.message
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
          htmlFor="duration_minute"
          //
          className="text-sm font-bold text-gray-700"
        >
          ระยะเวลา (นาที)
          <span className="text-red-500">*</span>
        </label>

        <input
          //
          id="duration_minute"
          //
          type="number"
          //
          min="1"
          //
          {...register(
            //
            "duration_minute",
            //
            {
              valueAsNumber: true,
            },
            //
          )}
          //
          placeholder="กรุณาระบุระยะเวลา"
          //
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 focus:ring-2 ${
            //
            errors.duration_minute
              ? //
                "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />

        {
          //
          errors.duration_minute && (
            //
            <p className="text-sm text-red-500">
              {
                //
                errors.duration_minute.message
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
        <label
          //
          htmlFor="quantity"
          //
          className="text-sm font-bold text-gray-700"
        >
          จำนวนที่จะสร้าง (หน่วย)
          <span className="text-red-500">*</span>
        </label>

        <input
          //
          id="quantity"
          //
          type="number"
          //
          min="1"
          //
          {...register(
            //
            "quantity",
            //
            {
              valueAsNumber: true,
            },
            //
          )}
          //
          placeholder="กรุณาระบุจำนวนที่จะสร้าง"
          //
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 focus:ring-2 ${
            //
            errors.quantity
              ? //
                "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />

        {
          //
          errors.quantity && (
            //
            <p className="text-sm text-red-500">
              {
                //
                errors.quantity.message
                //
              }
            </p>
          )
        }
      </div>

      {/* ================= */}
      {/* (จบ) Number Input */}
      {/* ================= */}

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
          {
            isPending
              ? //
                "กำลังบันทึก..."
              : //
                "บันทึกข้อมูล"
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
