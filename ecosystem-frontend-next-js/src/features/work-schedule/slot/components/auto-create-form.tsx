"use client";

import { z } from "zod";
import { DateTime, IANAZone } from "luxon";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAutoCreate } from "../hooks/use-auto-create";

// datetime-local is a wall time; resolve it only in the Place timezone.
export function resolveAutoCreateWallTime(value: string, timezone: string) {
  if (!IANAZone.isValidZone(timezone)) {
    throw new Error("เขตเวลาของสถานที่ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลสถานที่");
  }
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,3}))?)?$/.exec(
      value,
    );
  if (!match) throw new Error("กรุณาระบุวันที่และเวลาให้ถูกต้อง");

  const intended = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
    millisecond: Number((match[7] ?? "0").padEnd(3, "0")),
  };
  const resolved = DateTime.fromObject(intended, { zone: timezone });
  if (
    !resolved.isValid ||
    resolved.year !== intended.year ||
    resolved.month !== intended.month ||
    resolved.day !== intended.day ||
    resolved.hour !== intended.hour ||
    resolved.minute !== intended.minute ||
    resolved.second !== intended.second ||
    resolved.millisecond !== intended.millisecond
  ) {
    throw new Error("วันที่หรือเวลานี้ไม่มีอยู่จริงในเขตเวลาของสถานที่");
  }
  if (resolved.getPossibleOffsets().length !== 1) {
    throw new Error("เวลานี้เกิดซ้ำในเขตเวลาของสถานที่ กรุณาเลือกเวลาอื่น");
  }
  return resolved;
}

const createFormSchema = (timezone: string) =>
  z
    .object({
      target_mode: z.enum(["MINIMUM", "MAXIMUM"]),
      start_time: z.string().min(1, "กรุณาระบุเวลาเริ่มต้น"),
      end_time: z.string().min(1, "กรุณาระบุเวลาสิ้นสุด"),
      slot_template_ids: z
        .array(z.string())
        .min(1, "กรุณาเลือกแบบร่างอย่างน้อย 1 รายการ"),
      staff_ids: z.array(z.string()).min(1, "กรุณาเลือกพนักงานอย่างน้อย 1 คน"),
    })
    .superRefine((data, ctx) => {
      const resolved: Partial<Record<"start_time" | "end_time", DateTime>> = {};
      for (const field of ["start_time", "end_time"] as const) {
        if (!data[field]) continue;
        try {
          resolved[field] = resolveAutoCreateWallTime(data[field], timezone);
        } catch (error) {
          ctx.addIssue({
            code: "custom",
            path: [field],
            message:
              error instanceof Error
                ? error.message
                : "วันที่หรือเวลาไม่ถูกต้อง",
          });
        }
      }
      if (
        resolved.start_time &&
        resolved.end_time &&
        resolved.end_time.toMillis() <= resolved.start_time.toMillis()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["end_time"],
          message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น",
        });
      }
    });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export const AutoCreateForm = ({
  positionId,
  slotTemplates,
  staffPositions,
  placeTimezone,
  urlOnSuccess,
  urlOnCancel,
  skipErrorCodes,
}: {
  positionId: string;
  slotTemplates: { id: string; name: string }[];
  staffPositions: { staffId: string; name: string }[];
  placeTimezone: string;
  urlOnSuccess: string;
  urlOnCancel: string;
  skipErrorCodes?: readonly string[];
}) => {
  const router = useRouter();
  const { mutate, isPending } = useAutoCreate();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(placeTimezone)),
    defaultValues: {
      target_mode: "MINIMUM",
      start_time: "",
      end_time: "",
      slot_template_ids: [],
      staff_ids: [],
    },
  });

  const onSubmit = (values: FormValues) => {
    if (isPending) return;
    const start = resolveAutoCreateWallTime(values.start_time, placeTimezone);
    const end = resolveAutoCreateWallTime(values.end_time, placeTimezone);
    mutate(
      {
        positionId,
        targetMode: values.target_mode,
        startTime: start.toISO()!,
        endTime: end.toISO()!,
        slotTemplateIds: values.slot_template_ids,
        staffIds: values.staff_ids,
        skipErrorCodes,
      },
      {
        onSuccess: ({ createdCount }) => {
          toast.success(
            createdCount > 0
              ? `สร้างตารางเวร ${createdCount} รายการเรียบร้อยแล้ว`
              : "ไม่มีตารางเวรที่ต้องเพิ่ม",
          );
          router.push(urlOnSuccess);
        },
        onError: () =>
          toast.error("จัดเวรอัตโนมัติไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่"),
      },
    );
  };

  const inputClass =
    "w-full px-4 py-3 border border-border rounded-xl bg-card focus:ring-2 focus:ring-primary disabled:opacity-70";

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col gap-6"
    >
      <p className="text-sm text-muted-foreground">
        วันที่และเวลาอ้างอิงเขตเวลา {placeTimezone}
      </p>
      <fieldset disabled={isPending} className="flex flex-col gap-3">
        <legend className="text-sm font-bold mb-3">เป้าหมายการจัดเวร</legend>
        <label
          htmlFor="auto_target_minimum"
          className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer"
        >
          <input
            id="auto_target_minimum"
            type="radio"
            value="MINIMUM"
            {...register("target_mode")}
            aria-describedby="auto_target_minimum_help"
            className="h-5 w-5"
          />
          ให้ถึงจำนวนขั้นต่ำ (Min)
        </label>
        <p id="auto_target_minimum_help" className="text-sm text-muted-foreground">
          สร้างเฉพาะจำนวนที่ขาดเพื่อให้ถึง Min
        </p>
        <label
          htmlFor="auto_target_maximum"
          className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer"
        >
          <input
            id="auto_target_maximum"
            type="radio"
            value="MAXIMUM"
            {...register("target_mode")}
            aria-describedby="auto_target_maximum_help"
            className="h-5 w-5"
          />
          จัดให้มากที่สุดภายใต้จำนวนสูงสุด (Max)
        </label>
        <p id="auto_target_maximum_help" className="text-sm text-muted-foreground">
          จัดพนักงานที่เลือกและยังว่างให้มากที่สุด โดยช่วงที่มี Max จะไม่เกิน Max
          หากช่วงใดไม่มี Max ที่เป็นค่าจำกัด ระบบไม่มีเพดานจาก Min/Max ในช่วงนั้น
          และจะถูกจำกัดด้วยพนักงานที่เลือกและเวลาว่าง
        </p>
        {errors.target_mode && (
          <p role="alert" className="text-sm text-destructive">
            {errors.target_mode.message}
          </p>
        )}
      </fieldset>
      <div className="flex flex-col gap-2">
        <label htmlFor="auto_start_time" className="text-sm font-bold">
          เวลาเริ่มต้น
        </label>
        <input
          id="auto_start_time"
          type="datetime-local"
          {...register("start_time")}
          disabled={isPending}
          aria-invalid={!!errors.start_time}
          className={inputClass}
        />
        {errors.start_time && (
          <p role="alert" className="text-sm text-destructive">
            {errors.start_time.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="auto_end_time" className="text-sm font-bold">
          เวลาสิ้นสุด
        </label>
        <input
          id="auto_end_time"
          type="datetime-local"
          {...register("end_time")}
          disabled={isPending}
          aria-invalid={!!errors.end_time}
          className={inputClass}
        />
        {errors.end_time && (
          <p role="alert" className="text-sm text-destructive">
            {errors.end_time.message}
          </p>
        )}
      </div>
      <Controller
        control={control}
        name="slot_template_ids"
        render={({ field }) => (
          <fieldset disabled={isPending} className="flex flex-col gap-3">
            <legend className="text-sm font-bold mb-3">เลือกแบบร่าง</legend>
            {slotTemplates.map((template) => (
              <label
                key={template.id}
                className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={template.id}
                  checked={field.value.includes(template.id)}
                  onChange={(event) =>
                    field.onChange(
                      event.target.checked
                        ? [...field.value, template.id]
                        : field.value.filter((id) => id !== template.id),
                    )
                  }
                  onBlur={field.onBlur}
                  className="h-5 w-5"
                />
                {template.name}
              </label>
            ))}
            {errors.slot_template_ids && (
              <p role="alert" className="text-sm text-destructive">
                {errors.slot_template_ids.message}
              </p>
            )}
          </fieldset>
        )}
      />
      <Controller
        control={control}
        name="staff_ids"
        render={({ field }) => (
          <fieldset disabled={isPending} className="flex flex-col gap-3">
            <legend className="text-sm font-bold mb-3">เลือกพนักงาน</legend>
            {staffPositions.map((staff) => (
              <label
                key={staff.staffId}
                className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={staff.staffId}
                  checked={field.value.includes(staff.staffId)}
                  onChange={(event) =>
                    field.onChange(
                      event.target.checked
                        ? [...field.value, staff.staffId]
                        : field.value.filter((id) => id !== staff.staffId),
                    )
                  }
                  onBlur={field.onBlur}
                  className="h-5 w-5"
                />
                {staff.name}
              </label>
            ))}
            {errors.staff_ids && (
              <p role="alert" className="text-sm text-destructive">
                {errors.staff_ids.message}
              </p>
            )}
          </fieldset>
        )}
      />
      <div className="border-t border-border pt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push(urlOnCancel)}
          disabled={isPending}
          className="min-h-11 w-full px-6 py-3 sm:w-auto text-muted-foreground font-medium hover:bg-muted rounded-xl"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 w-full px-6 py-3 sm:w-auto bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-70"
        >
          {isPending ? "กำลังจัดเวร..." : "จัดเวรอัตโนมัติ"}
        </button>
      </div>
    </form>
  );
};
