"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

// 🌟 Import your Mutation Hook and Shared Schema
import { useCreateWorkScheduleStaff } from "@/features/work-schedule/staff/hooks/use-create-work-schedule-staff";
import { CreateWorkScheduleStaffDtoBodySchema } from "@backend/modules/work-schedule/staff/commands/create-work-schedule-staff.command";

// ==========================================
// 🌟 Schema สำหรับตรวจสอบข้อมูล
// ==========================================
const CreateWorkScheduleStaffFrontendFormSchema =
  CreateWorkScheduleStaffDtoBodySchema.pick({
    name: true,
  });

// 3. INFER: Now, we infer the type from our NEW custom frontend schema!
type CreateWorkScheduleStaffFrontendForm = z.infer<
  typeof CreateWorkScheduleStaffFrontendFormSchema
>;

// ==========================================
// 🌟 Main
// ==========================================
export const CreateWorkScheduleStaffForm = ({
  placeId,
  className = "",
}: {
  placeId: string;
  className?: string; // 🌟 This makes your component flexible!
}) => {
  const router = useRouter();

  // 🧠 1. Logic: Form State & API Mutation
  const { mutate: createWorkScheduleStaff, isPending } =
    useCreateWorkScheduleStaff();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkScheduleStaffFrontendForm>({
    resolver: zodResolver(CreateWorkScheduleStaffFrontendFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data: CreateWorkScheduleStaffFrontendForm) => {
    createWorkScheduleStaff(
      { placeId: placeId, name: data.name },
      {
        onSuccess: () => {
          toast.success("เพิ่มพนักงานเข้าสู่ระบบเรียบร้อยแล้ว");
          // Redirect back to the Dashboard list
          router.push(`/work-schedule/admin/${placeId}/staff`);
        },
        onError: () => {
          toast.error("ไม่สามารถเพิ่มพนักงานได้ กรุณาลองใหม่อีกครั้ง");
        },
      },
    );
  };

  // 🎨 2. UI: Render the form
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      // 🌟 Merge the default styling with the injected className
      className={`bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col gap-6 ${className}`}
    >
      {/* ======================= */}
      {/* 🟢 Input Zone */}
      {/* ======================= */}

      {/* Name Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-bold text-gray-700">
          ชื่อพนักงาน <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          placeholder="เช่น ปริวิทธ์ ตั้งจิตธรรม, ปริวิทธ์ (แบงค์), แบงค์, นายปริวิทธ์ ตั้งจิตธรรม, แบงค์ (ปริวิทธ์)"
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

      {/* ======================= */}
      {/* 🟢 Action Buttons */}
      {/* ======================= */}

      <div className="border-t border-gray-100 pt-6 mt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(`/work-schedule/admin/${placeId}/staff`)}
          disabled={isPending}
          className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-all"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </div>
    </form>
  );
};
