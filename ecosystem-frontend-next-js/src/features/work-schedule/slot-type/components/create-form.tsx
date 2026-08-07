"use client";

import { CreateDtoBodySchema } from "@backend/modules/work-schedule/slot-type/commands/create.command";
import { z } from "zod";

import { useRouter } from "next/navigation";
import { useCreate } from "../hooks/use-create";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

const FrontendFormSchema = CreateDtoBodySchema;
type FrontendForm = z.infer<typeof FrontendFormSchema>;

export const CreateForm = ({
  positionId,

  urlOnSuccess,
  urlOnCancel,

  skipErrorCodes,
}: {
  positionId: string;

  urlOnSuccess: string;
  urlOnCancel: string;

  skipErrorCodes?: readonly string[];
}) => {
  const router = useRouter();

  const { mutate: mutateCreate, isPending } = useCreate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FrontendForm>({
    resolver: zodResolver(FrontendFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (data: FrontendForm) => {
    mutateCreate(
      {
        positionId: positionId,

        name: data.name,

        skipErrorCodes: skipErrorCodes,
      },
      {
        onSuccess: () => {
          toast.success("สร้างประเภทเวรใหม่เรียบร้อยแล้ว");

          router.push(urlOnSuccess);
        },
        onError: () => {
          toast.error("ไม่สามารถสร้างประเภทเวรใหม่ได้ กรุณาลองใหม่อีกครั้ง");
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col gap-6`}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-bold text-gray-700">
          ชื่อ <span className="text-red-500">*</span>
        </label>

        <input
          id="name"
          type="text"
          {...register("name")}
          placeholder="เช่น เวรเช้า (M), เวรบ่าย (A), เวรดึก (N), กะเปิดร้าน"
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

      <div className="border-t border-gray-100 pt-6 mt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(urlOnCancel)}
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
