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
      className={`bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col gap-6`}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-bold text-foreground">
          ชื่อ <span className="text-destructive">*</span>
        </label>

        <input
          id="name"
          type="text"
          {...register("name")}
          placeholder="เช่น เวรเช้า (M), เวรบ่าย (A), เวรดึก (N), กะเปิดร้าน"
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background focus:ring-2 ${
            errors.name
              ? "border-destructive focus:ring-destructive focus:border-destructive"
              : "border-border focus:ring-primary focus:border-ring"
          }`}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="border-t border-border pt-6 mt-2 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push(urlOnCancel)}
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
