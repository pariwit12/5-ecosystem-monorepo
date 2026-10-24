"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCreatePerson } from "@/features/person/hooks/use-create-person";

export const CreatePersonForm = ({
  className = "",
}: {
  className?: string;
}) => {
  const router = useRouter();

  const { mutate: mutateCreatePerson, isPending } = useCreatePerson();

  const { handleSubmit } = useForm({
    defaultValues: {},
  });

  const onSubmit = () => {
    mutateCreatePerson(undefined, {
      onSuccess: () => {
        toast.success("สร้าง Person เรียบร้อยแล้ว");

        router.push(`/`);
      },
      onError: () => {
        toast.error("ไม่สามารถสร้าง Person ได้ กรุณาลองใหม่อีกครั้ง");
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col gap-6 ${className}`}
    >
      {/* ============================ */}
      {/* 🟢 Action Buttons Zone */}
      {/* ============================ */}

      <div className="border-t border-border pt-6 mt-2 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        {/*  */}
        {/* ==================== */}
        {/* Back Button */}
        {/* ==================== */}

        <button
          type="button"
          onClick={() => router.push(`/`)}
          disabled={isPending}
          className="min-h-11 w-full px-6 py-3 sm:w-auto text-muted-foreground font-medium hover:bg-muted rounded-xl transition-all"
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
          className="min-h-11 w-full px-6 py-3 sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
