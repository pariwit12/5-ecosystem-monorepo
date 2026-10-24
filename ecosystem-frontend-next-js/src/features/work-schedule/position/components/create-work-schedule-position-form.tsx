"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { useCreateWorkSchedulePosition } from "@/features/work-schedule/position/hooks/use-create-work-schedule-position";

import { CreateWorkSchedulePositionDtoBodySchema } from "@backend/modules/work-schedule/position/commands/create-work-schedule-position.command";

const CreateWorkSchedulePositionFrontendFormSchema =
  CreateWorkSchedulePositionDtoBodySchema.pick({
    name: true,
  });
type CreateWorkSchedulePositionFrontendForm = z.infer<
  typeof CreateWorkSchedulePositionFrontendFormSchema
>;

export const CreateWorkSchedulePositionForm = ({
  placeId,

  skipErrorCodes,

  className = "",
}: {
  placeId: string;

  skipErrorCodes?: string[];

  className?: string;
}) => {
  const router = useRouter();

  const { mutate: mutateCreateWorkSchedulePosition, isPending } =
    useCreateWorkSchedulePosition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWorkSchedulePositionFrontendForm>({
    resolver: zodResolver(CreateWorkSchedulePositionFrontendFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data: CreateWorkSchedulePositionFrontendForm) => {
    mutateCreateWorkSchedulePosition(
      {
        placeId: placeId,

        name: data.name,

        skipErrorCodes: skipErrorCodes,
      },
      {
        onSuccess: () => {
          toast.success("สร้าง position เรียบร้อยแล้ว");

          router.push(`/work-schedule/admin/${placeId}/position`);
        },
        onError: () => {
          toast.error("ไม่สามารถสร้าง position ได้ กรุณาลองใหม่อีกครั้ง");
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col gap-6 ${className}`}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-bold text-foreground">
          ชื่อตำแหน่ง
          <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          placeholder="เช่น วอร์ดอายุรกรรมชาย (ชั้น 4)"
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

      <div className="border-t border-border pt-6 mt-2 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() =>
            router.push(`/work-schedule/admin/${placeId}/position`)
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
