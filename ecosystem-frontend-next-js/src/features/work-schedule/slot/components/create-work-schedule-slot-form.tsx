"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { DateTime } from "luxon";

import { useCreateWorkScheduleSlot } from "../hooks/use-create-work-schedule-slot";

import { CreateWorkScheduleSlotDtoBodySchema } from "@backend/modules/work-schedule/slot/commands/create-work-schedule-slot.command";

// ==========================================
// 🌟 สร้าง Schema + Type สำหรับ Form
// ==========================================

const CreateWorkScheduleSlotFrontendFormSchema =
  CreateWorkScheduleSlotDtoBodySchema.pick({
    name: true,
    actual_start_time: true,
    actual_end_time: true,
  });
type CreateWorkScheduleSlotFrontendForm = z.infer<
  typeof CreateWorkScheduleSlotFrontendFormSchema
>;

// ==========================================
// 🌟 (จบ) สร้าง Schema + Type สำหรับ Form
// ==========================================

// ==========================================
// 🌟 Main
// ==========================================

export const CreateWorkScheduleSlotForm = ({
  positionId,
  placeTimezone,

  urlOnSuccess,
  urlOnCancel,

  skipErrorCodes,

  className = "",
}: {
  positionId: string;
  placeTimezone: string;

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
    formState: { errors },
  } = useForm<CreateWorkScheduleSlotFrontendForm>({
    resolver: zodResolver(CreateWorkScheduleSlotFrontendFormSchema),
    defaultValues: {
      name: "",
      actual_start_time: "",
      actual_end_time: "",
    },
  });

  // ===============
  // (จบ) ตั้งค่า Form
  // ===============

  // ================
  // จัดการผลลัพธ์
  // ================

  const onSubmit = (data: CreateWorkScheduleSlotFrontendForm) => {
    //
    // ==============================================
    // 🌟 จัดการข้อมูลให้เรียบร้อยก่อนส่งต่อให้ use-hooks
    // ==============================================

    const startIso =
      DateTime.fromISO(data.actual_start_time, {
        zone: placeTimezone,
      }).toISO() || "";
    const endIso =
      DateTime.fromISO(data.actual_end_time, {
        zone: placeTimezone,
      }).toISO() || "";

    // ==============================================
    // 🌟 (จบ) จัดการข้อมูลให้เรียบร้อยก่อนส่งต่อให้ use-hooks
    // ==============================================

    mutateCreateWorkScheduleSlot(
      {
        positionId: positionId,

        name: data.name,
        actualStartTime: startIso,
        actualEndTime: endIso,

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
          ชื่อ
          <span className="text-red-500">*</span>
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
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* ================ */}
      {/* (จบ) Text Input */}
      {/* ================ */}

      {/* =================== */}
      {/* Datetime Input */}
      {/* =================== */}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="actual_start_time"
          className="text-sm font-bold text-gray-700"
        >
          เวลาเริ่มต้น <span className="text-red-500">*</span>
        </label>
        <input
          id="actual_start_time"
          type="datetime-local"
          {...register("actual_start_time")}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
            errors.actual_start_time
              ? "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />
        {errors.actual_start_time && (
          <p className="text-sm text-red-500 mt-1">
            {errors.actual_start_time.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="actual_end_time"
          className="text-sm font-bold text-gray-700"
        >
          เวลาสิ้นสุด <span className="text-red-500">*</span>
        </label>
        <input
          id="actual_end_time"
          type="datetime-local"
          {...register("actual_end_time")}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
            errors.actual_end_time
              ? "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />
        {errors.actual_end_time && (
          <p className="text-sm text-red-500 mt-1">
            {errors.actual_end_time.message}
          </p>
        )}
      </div>

      {/* =================== */}
      {/* (จบ) Datetime Input */}
      {/* =================== */}

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
