"use client";

import { CreateDtoBodySchema } from "@backend/modules/work-schedule/min-max/commands/create.command";
import { z } from "zod";

import { useRouter } from "next/navigation";
import { useCreate } from "../hooks/use-create";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { DateTime } from "luxon";

import { toast } from "sonner";

const FrontendFormSchema = CreateDtoBodySchema;

type FrontendForm = z.infer<typeof FrontendFormSchema>;

export const CreateForm = ({
  positionId,
  placeTimezone,

  urlOnSuccess,
  urlOnCancel,

  skipErrorCodes,
}: {
  positionId: string;
  placeTimezone: string;

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
      min: undefined,
      max: undefined,
      start_time: "",
      end_time: "",
    },
  });

  const onSubmit = (data: FrontendForm) => {
    const processedStartTime =
      DateTime.fromISO(data.start_time, {
        zone: placeTimezone,
      }).toISO() || "";

    const processedEndTime =
      DateTime.fromISO(data.end_time, {
        zone: placeTimezone,
      }).toISO() || "";

    mutateCreate(
      {
        positionId: positionId,

        min: data.min,
        max: data.max,
        startTime: processedStartTime,
        endTime: processedEndTime,

        skipErrorCodes: skipErrorCodes,
      },
      {
        onSuccess: () => {
          toast.success("สร้างข้อมูลใหม่เรียบร้อยแล้ว");

          router.push(urlOnSuccess);
        },
        onError: () => {
          toast.error("สร้างข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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
        <label htmlFor="min" className="text-sm font-bold text-foreground">
          ปริมาณพนักงานต่ำสุด (คน)
        </label>

        <input
          id="min"
          type="number"
          min="0"
          {...register("min", {
            setValueAs: (v) => (v === "" ? undefined : Number(v)),
          })}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background focus:ring-2 ${
            errors.min
              ? "border-destructive focus:ring-destructive focus:border-destructive"
              : "border-border focus:ring-primary focus:border-ring"
          }`}
        />

        {errors.min && (
          <p className="text-sm text-destructive">{errors.min.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="max" className="text-sm font-bold text-foreground">
          ปริมาณพนักงานสูงสุด (คน)
        </label>

        <input
          id="max"
          type="number"
          min="0"
          {...register("max", {
            setValueAs: (v) => (v === "" ? undefined : Number(v)),
          })}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background focus:ring-2 ${
            errors.max
              ? "border-destructive focus:ring-destructive focus:border-destructive"
              : "border-border focus:ring-primary focus:border-ring"
          }`}
        />

        {errors.max && (
          <p className="text-sm text-destructive">{errors.max.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="start_time" className="text-sm font-bold text-foreground">
          เวลาเริ่มต้น <span className="text-destructive">*</span>
        </label>

        <input
          id="start_time"
          type="datetime-local"
          {...register("start_time", {
            setValueAs: (v) => {
              if (!v) return "";
              return DateTime.fromISO(v, { zone: placeTimezone }).toISO();
            },
          })}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background bg-card focus:ring-2 ${
            errors.start_time
              ? "border-destructive focus:ring-destructive focus:border-destructive"
              : "border-border focus:ring-primary focus:border-ring"
          }`}
        />
        {errors.start_time && (
          <p className="text-sm text-destructive">{errors.start_time.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="end_time" className="text-sm font-bold text-foreground">
          เวลาสิ้นสุด <span className="text-destructive">*</span>
        </label>

        <input
          id="end_time"
          type="datetime-local"
          {...register("end_time", {
            setValueAs: (v) => {
              if (!v) return "";
              return DateTime.fromISO(v, { zone: placeTimezone }).toISO();
            },
          })}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background bg-card focus:ring-2 ${
            errors.end_time
              ? "border-destructive focus:ring-destructive focus:border-destructive"
              : "border-border focus:ring-primary focus:border-ring"
          }`}
        />
        {errors.end_time && (
          <p className="text-sm text-destructive">{errors.end_time.message}</p>
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
