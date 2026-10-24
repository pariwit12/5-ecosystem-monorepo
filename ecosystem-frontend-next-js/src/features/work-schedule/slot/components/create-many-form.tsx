"use client";

import { z } from "zod";

import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";

import { useState } from "react";

import { useCreateMany } from "../hooks/use-create-many";

import { toast } from "sonner";
import { DateTime } from "luxon";

import { Calendar } from "@/components/ui/calendar";
import { workScheduleSlotQueries } from "../work-schedule-slot.queries";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

const FrontendFormSchema = z.object({
  slot_type_id: z.uuid({
    version: "v7",
    message: "รูปแบบรหัส slot_type_id ไม่ถูกต้อง",
  }),

  dates: z
    .array(
      // ใช้ z.date() แทน z.string() เพราะ calendar ของ shadcn จะส่งค่ามาให้เป็น date
      z.date({
        message: "dates ต้องเป็น type: date เท่านั้น",
      }),
    )
    .min(1, "กรุณาเลือกวันที่อย่างน้อย 1 วัน"),
  // เช่น [new Date("2026-07-01"), new Date("2026-07-03")] (array ของ ค่าวันที่ที่ผู้ใช้เลือกจากปฏิทิน (เป็น JS Date Object))

  start_time: z
    .string({
      message: "startTime ต้องเป็น type: string เท่านั้น",
    })
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "รูปแบบเวลาไม่ถูกต้อง กรุณาใช้รูปแบบ HH:mm (เช่น 08:00, 20:30)",
    ), // เช่น "08:00"

  duration_minute: z
    .number({
      message: "ระยะเวลาต้องเป็น type: number เท่านั้น",
    })
    .int({
      message: "ระยะเวลาต้องเป็น จำนวนเต็มบวก เท่านั้น",
    })
    .min(1, "ระยะเวลาต้องไม่ต่ำกว่า 1 นาที"),
});
type FrontendForm = z.infer<typeof FrontendFormSchema>;

export const CreateManyForm = ({
  positionId,
  staffPositions,
  placeTimezone,
  availableSlotTypes,

  prefillSlotTypeId,
  prefillStartTime,
  prefillDurationMinute,

  urlOnSuccess,
  urlOnCancel,

  skipErrorCodes,

  className = "",
}: {
  positionId: string;
  staffPositions: {
    staffId: string;
    name: string;
  }[];
  placeTimezone: string;
  availableSlotTypes: {
    id: string;
    name: string;
  }[];

  prefillSlotTypeId?: string;
  prefillStartTime?: string;
  prefillDurationMinute?: number;

  urlOnSuccess: string;
  urlOnCancel: string;

  skipErrorCodes?: string[];

  className?: string;
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getToken, userId } = useAuth();

  const { mutate: mutateCreateMany, isPending } = useCreateMany();
  const [isPreflightPending, setIsPreflightPending] = useState(false);
  const [isSubmittingFlow, setIsSubmittingFlow] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmitting = isPending || isSubmittingFlow;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FrontendForm>({
    resolver: zodResolver(FrontendFormSchema),
    defaultValues: {
      slot_type_id: availableSlotTypes.some(
        (slotType) => slotType.id === prefillSlotTypeId,
      )
        ? prefillSlotTypeId
        : "",
      dates: [], // ตัวอย่างข้อมูล: [new Date("2026-07-01"), new Date("2026-07-03")] (array ของ ค่าวันที่ที่ผู้ใช้เลือกจากปฏิทิน (เป็น JS Date Object))
      start_time: prefillStartTime || "",
      duration_minute: prefillDurationMinute || 0,
    },
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = () => {
    setSubmitError(null);
    if (selectedIds.length === staffPositions.length) {
      // ถ้าเลือกครบแล้ว ให้เคลียร์ทิ้ง
      setSelectedIds([]);
    } else {
      // ถ้ายังไม่ครบ ให้เลือกทั้งหมด
      setSelectedIds(
        staffPositions.map((staffPosition) => staffPosition.staffId),
      );
    }
  };

  const handleToggleSelect = (id: string) => {
    setSubmitError(null);
    setSelectedIds(
      (prev) =>
        prev.includes(id)
          ? prev.filter((item) => item !== id) // เอาออก
          : [...prev, id], // เพิ่มเข้า
    );
  };

  // Function แสดงเวลาสิ้นสุด (จาก start_time และ duration_minutue)

  const startTimeValue = useWatch({
    control,
    name: "start_time",
  });
  const durationValue = useWatch({
    control,
    name: "duration_minute",
  });

  // Function แสดงเวลาสิ้นสุด (จาก start_time และ duration_minutue)

  let endTimeDisplay = null;

  if (startTimeValue && durationValue > 0) {
    const [hours, minutes] = startTimeValue.split(":").map(Number);

    if (!isNaN(hours) && !isNaN(minutes)) {
      // แปลงเป็นนาทีทั้งหมด แล้วบวก duration
      const totalMinutes = hours * 60 + minutes + durationValue;

      // คำนวณชั่วโมงและนาทีกลับ
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMinutes = totalMinutes % 60;

      // เช็คว่าข้ามวันหรือไม่
      const daysLater = Math.floor(totalMinutes / (24 * 60));

      const formattedTime = `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

      // ข้อความต่อท้าย (กรณีผลลัพธ์ไม่อยู่ในวัน)
      let daySuffix = "";
      if (daysLater === 1) {
        daySuffix = " (ของวันถัดไป)";
      } else if (daysLater > 1) {
        daySuffix = ` (ของ ${daysLater} วันถัดไป)`;
      }

      endTimeDisplay = `เวลาเลิกงาน: ${formattedTime} น.${daySuffix}`;
    }
  }

  const onSubmit = async (data: FrontendForm) => {
    if (isSubmittingFlow || isPending) return;

    if (selectedIds.length === 0) {
      setSubmitError("กรุณาเลือกพนักงานอย่างน้อย 1 คนก่อนสร้างเวร");
      return;
    }

    const slotsPayload: {
      staff_id: string;
      slot_type_id: string;
      actual_start_time: string;
      actual_end_time: string;
    }[] = [];

    // data.dates ตอนนี้เป็น Array ของ Date Object (เพราะเราใช้ Calendar จาก shadcn)
    for (const dateObj of data.dates) {
      // แปลง Date object ของ JS ให้เป็น String "YYYY-MM-DD" ก่อน
      const dateString = DateTime.fromJSDate(dateObj).toFormat("yyyy-MM-dd");

      // ประกอบร่าง วันที่ + เวลา โดยอ้างอิง Timezone
      const startDt = DateTime.fromFormat(
        `${dateString} ${data.start_time}`,
        "yyyy-MM-dd HH:mm",
        {
          zone: placeTimezone,
        },
      );

      // คำนวณเวลาจบ
      const endDt = startDt.plus({ minutes: data.duration_minute });

      // แปลงเป็น ISO string เพื่อส่งไป Backend
      const actual_start_time = startDt.toISO()!;
      const actual_end_time = endDt.toISO()!;

      selectedIds.forEach((staffId) => {
        slotsPayload.push({
          staff_id: staffId,
          slot_type_id: data.slot_type_id,
          actual_start_time,
          actual_end_time,
        });
      });
    }

    if (slotsPayload.length === 0) {
      setSubmitError(
        "ไม่พบรายการเวรสำหรับสร้าง กรุณาเลือกวันที่และพนักงานใหม่",
      );
      return;
    }

    setIsSubmittingFlow(true);
    setIsPreflightPending(true);
    setSubmitError(null);

    try {
      if (!userId) throw new Error("Authentication is not ready");

      const startTime = new Date(
        Math.min(
          ...slotsPayload.map((slot) => Date.parse(slot.actual_start_time)),
        ),
      ).toISOString();
      const endTime = new Date(
        Math.max(
          ...slotsPayload.map((slot) => Date.parse(slot.actual_end_time)),
        ),
      ).toISOString();
      const query =
        workScheduleSlotQueries.queryGetSlotsByPositionIdStartTimeEndTime(
          positionId,
          startTime,
          endTime,
          userId,
          getToken,
          skipErrorCodes,
        );
      const preflight = await queryClient.fetchQuery({
        ...query,
        staleTime: 0,
        retry: false,
      });

      const staffNames = new Map(
        staffPositions.map((staffPosition) => [
          staffPosition.staffId,
          staffPosition.name,
        ]),
      );
      const conflict = slotsPayload.flatMap((slot) => {
        const holiday = preflight.workScheduleHolidays.find(
          (item) =>
            item.staffId === slot.staff_id &&
            Date.parse(slot.actual_start_time) < Date.parse(item.endTime) &&
            Date.parse(slot.actual_end_time) > Date.parse(item.startTime),
        );
        return holiday ? [{ slot, holiday }] : [];
      })[0];

      if (conflict) {
        const slotStart = DateTime.fromISO(conflict.slot.actual_start_time, {
          zone: placeTimezone,
        }).toFormat("dd/MM/yyyy HH:mm");
        const slotEnd = DateTime.fromISO(conflict.slot.actual_end_time, {
          zone: placeTimezone,
        }).toFormat("dd/MM/yyyy HH:mm");
        const holidayStart = DateTime.fromISO(conflict.holiday.startTime, {
          zone: placeTimezone,
        }).toFormat("dd/MM/yyyy HH:mm");
        const holidayEnd = DateTime.fromISO(conflict.holiday.endTime, {
          zone: placeTimezone,
        }).toFormat("dd/MM/yyyy HH:mm");
        const staffName =
          staffNames.get(conflict.slot.staff_id) ?? conflict.slot.staff_id;

        setSubmitError(
          `${staffName} มีวันหยุด ${holidayStart} - ${holidayEnd} ทับกับเวร ${slotStart} - ${slotEnd} กรุณาแก้ไขก่อนสร้างเวร`,
        );
        setIsSubmittingFlow(false);
        setIsPreflightPending(false);
        return;
      }

      setIsPreflightPending(false);
      mutateCreateMany(
        {
          positionId: positionId,
          slots: slotsPayload,
          skipErrorCodes: skipErrorCodes,
        },
        {
          onSuccess: () => {
            setIsSubmittingFlow(false);
            toast.success("สร้าง workScheduleSlot เรียบร้อยแล้ว");
            router.push(urlOnSuccess);
          },
          onError: (error) => {
            setIsSubmittingFlow(false);
            const errorCode = (
              error as { response?: { data?: { errorCode?: unknown } } }
            ).response?.data?.errorCode;
            if (errorCode !== ErrorCode.WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP) {
              toast.error(
                "ไม่สามารถสร้าง workScheduleSlot ได้ กรุณาลองใหม่อีกครั้ง",
              );
            }
          },
        },
      );
    } catch {
      setIsSubmittingFlow(false);
      setIsPreflightPending(false);
      setSubmitError(
        "ตรวจสอบวันหยุดไม่สำเร็จ กรุณาลองส่งข้อมูลอีกครั้งก่อนสร้างเวร",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col gap-6 ${className}`}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="dates" className="text-sm font-bold text-foreground">
          เลือกวันที่ต้องการสร้างเวร <span className="text-destructive">*</span>
        </label>

        {/* 🌟 พระเอกของเรา Controller + shadcn Calendar */}
        <Controller
          control={control}
          name="dates"
          render={({ field }) => (
            <Calendar
              mode="multiple" // สั่งให้เลือกได้หลายวัน
              selected={field.value} // ค่าจาก Form
              onSelect={field.onChange} // ส่งค่ากลับไป Form
              disabled={isSubmitting}
              className="bg-card rounded-md border shadow-sm
                max-w-150
                portrait:w-full
                landscape:w-[100vh] 
              "
            />
          )}
        />
        {errors.dates && (
          <p className="text-sm text-destructive mt-1">{errors.dates.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="slot_type_id"
          className="text-sm font-bold text-foreground"
        >
          ชนิด/ประเภทกะการทำงาน <span className="text-destructive">*</span>
        </label>

        <select
          id="slot_type_id"
          {...register("slot_type_id")}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background bg-card focus:ring-2 ${
            errors.slot_type_id
              ? "border-destructive focus:ring-destructive focus:border-destructive"
              : "border-border focus:ring-primary focus:border-ring"
          }`}
        >
          {availableSlotTypes.map((ast) => (
            <option key={ast.id} value={ast.id}>
              {ast.name}
            </option>
          ))}
        </select>

        {errors.slot_type_id && (
          <p className="text-sm text-destructive">{errors.slot_type_id.message}</p>
        )}

        <p className="text-xs text-muted-foreground">
          ชนิด/ประเภทกะการทำงาน จะถูกใช้ในการคำนวณและแสดงผลตารางกะการทำงาน
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="start_time" className="text-sm font-bold text-foreground">
          เวลาเริ่มงาน <span className="text-destructive">*</span>
        </label>
        <input
          id="start_time"
          type="time"
          {...register("start_time")}
          disabled={isSubmitting}
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
        <label
          htmlFor="duration_minute"
          className="text-sm font-bold text-foreground"
        >
          ระยะเวลา (นาที) <span className="text-destructive">*</span>
        </label>

        <input
          id="duration_minute"
          type="number"
          min="1"
          {...register(
            "duration_minute",

            {
              valueAsNumber: true,
            },
          )}
          placeholder="กรุณาระบุระยะเวลา"
          disabled={isSubmitting}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background focus:ring-2 ${
            errors.duration_minute
              ? "border-destructive focus:ring-destructive focus:border-destructive"
              : "border-border focus:ring-primary focus:border-ring"
          }`}
        />

        {errors.duration_minute && (
          <p className="text-sm text-destructive">
            {errors.duration_minute.message}
          </p>
        )}
      </div>

      {/* =============================== */}
      {/* พื้นที่แสดงผลลัพธ์จากค่าใน form */}
      {/* =============================== */}

      {/* // Function แสดงเวลาสิ้นสุด (จาก start_time และ duration_minutue) */}

      <div
        className={`text-sm px-4 py-3 rounded-lg border transition-all ${
          endTimeDisplay
            ? "bg-primary/10 border-primary/20 text-primary"
            : "bg-background border-border text-muted-foreground"
        }`}
      >
        {endTimeDisplay ||
          "กรุณาระบุเวลาเริ่มต้นและระยะเวลา เพื่อดูเวลาเลิกงาน"}
      </div>

      {/* =============================== */}
      {/* (จบ) พื้นที่แสดงผลลัพธ์จากค่าใน form */}
      {/* =============================== */}

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          disabled={isSubmitting}
          checked={
            selectedIds.length === staffPositions.length &&
            staffPositions.length > 0
          }
          onChange={handleSelectAll}
          className="w-5 h-5 cursor-pointer rounded border-border"
        />
        <span className="text-sm font-medium text-foreground">
          เลือกทั้งหมด ({selectedIds.length}/{staffPositions.length})
        </span>
      </div>

      <ul className="divide-y divide-border bg-card rounded-lg shadow-sm">
        {staffPositions.map((staffPosition) => (
          <li
            key={staffPosition.staffId}
            className="flex items-center p-4 hover:bg-background"
          >
            <input
              type="checkbox"
              disabled={isSubmitting}
              checked={selectedIds.includes(staffPosition.staffId)}
              onChange={() => handleToggleSelect(staffPosition.staffId)}
              className="w-5 h-5 mr-4 cursor-pointer rounded border-border"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {staffPosition.name}
              </p>
              <p className="text-sm text-muted-foreground">
                ID: {staffPosition.staffId}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      <div className="border-t border-border pt-6 mt-2 flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push(urlOnCancel)}
          disabled={isSubmitting}
          className="min-h-11 w-full px-6 py-3 sm:w-auto text-muted-foreground font-medium hover:bg-muted rounded-xl transition-all"
        >
          ยกเลิก
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 w-full px-6 py-3 sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPreflightPending
            ? "กำลังตรวจสอบวันหยุด..."
            : isPending
              ? "กำลังบันทึก..."
              : "บันทึกข้อมูล"}
        </button>
      </div>
    </form>
  );
};
