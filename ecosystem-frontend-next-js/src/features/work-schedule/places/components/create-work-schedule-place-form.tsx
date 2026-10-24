"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

// 🌟 Import your Mutation Hook and Shared Schema
import { useCreateWorkSchedulePlace } from "../hooks/use-create-work-schedule-place";
import { CreateWorkSchedulePlaceDtoBodySchema } from "@backend/modules/work-schedule/places/commands/create-work-schedule-place.command";

// ==========================================
// 🌟 THE ZOD MAGIC HAPPENS HERE!
// ==========================================
const FrontendFormSchema = CreateWorkSchedulePlaceDtoBodySchema.pick({
  name: true,
  timezone: true,
  // กรณีมี field ที่ต้องการเพิ่มเติมจาก backendSchema
  // }).extend({
  //   isConfirmed: z.boolean().refine((val) => val === true, {
  //     message: "คุณต้องยืนยันข้อมูลก่อนบันทึก", // "You must confirm before saving"
  //   }),
});

// 3. INFER: Now, we infer the type from our NEW custom frontend schema!
type CreatePlaceFormValues = z.infer<typeof FrontendFormSchema>;

// Get Timezone data
const allTimezones = Intl.supportedValuesOf("timeZone");
const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface CreateWorkSchedulePlaceFormProps {
  orgId: string;
  className?: string; // 🌟 This makes your component flexible!
}

export const CreateWorkSchedulePlaceForm = ({
  orgId,
  className = "",
}: CreateWorkSchedulePlaceFormProps) => {
  const router = useRouter();

  // 🧠 1. Logic: Form State & API Mutation
  const { mutate: createPlace, isPending } = useCreateWorkSchedulePlace();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePlaceFormValues>({
    resolver: zodResolver(FrontendFormSchema),
    defaultValues: {
      name: "",
      timezone: defaultTimezone,
    },
  });

  const onSubmit = (data: CreatePlaceFormValues) => {
    createPlace(
      { orgId, body: data },
      {
        onSuccess: () => {
          toast.success("สร้างสถานที่ทำงานเรียบร้อยแล้ว");
          // Redirect back to the Dashboard list
          router.push(`/organizations/${orgId}/work-schedule`);
        },
        onError: () => {
          toast.error("ไม่สามารถสร้างสถานที่ทำงานได้ กรุณาลองใหม่อีกครั้ง");
        },
      },
    );
  };

  // 🎨 2. UI: Render the form
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      // 🌟 Merge the default styling with the injected className
      className={`bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col gap-6 ${className}`}
    >
      {/* 🟢 Name Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-bold text-foreground">
          ชื่อสถานที่ทำงาน <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          placeholder="เช่น คลินิกสาขาอารีย์, วอร์ดผู้ป่วยใน"
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background focus:ring-2 ${
            errors.name
              ? "border-destructive focus:ring-destructive focus:border-destructive"
              : "border-border focus:ring-primary focus:border-ring"
          }`}
        />
        {errors.name && (
          <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* 🟢 Timezone Selector */}
      <div className="flex flex-col gap-2">
        <label htmlFor="timezone" className="text-sm font-bold text-foreground">
          เขตเวลา (Timezone) <span className="text-destructive">*</span>
        </label>
        <select
          id="timezone"
          {...register("timezone")}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background bg-card focus:ring-2 ${
            errors.timezone
              ? "border-destructive focus:ring-destructive focus:border-destructive"
              : "border-border focus:ring-primary focus:border-ring"
          }`}
        >
          {allTimezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        {errors.timezone && (
          <p className="text-sm text-destructive mt-1">{errors.timezone.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          เวลามาตรฐานที่จะถูกใช้ในการคำนวณและแสดงผลตารางกะการทำงาน
        </p>
      </div>

      {/* 🟢 Action Buttons */}
      <div className="border-t border-border pt-6 mt-2 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() =>
            router.push(
              // ปรับตามใช้งานจริง
              `/work-schedule`,
            )
          }
          disabled={isPending}
          className="min-h-11 w-full px-6 py-3 sm:w-auto text-muted-foreground font-medium hover:bg-muted rounded-xl transition-all"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 w-full px-6 py-3 sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
      </div>
    </form>
  );
};
