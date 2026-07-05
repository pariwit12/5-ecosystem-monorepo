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
      className={`bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col gap-6 ${className}`}
    >
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
          onClick={() => router.push(`/`)}
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
