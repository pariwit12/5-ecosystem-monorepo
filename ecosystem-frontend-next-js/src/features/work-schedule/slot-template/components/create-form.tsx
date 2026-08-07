"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { useCreate } from "../hooks/use-create";

import { CreateDtoBodySchema } from "@backend/modules/work-schedule/slot-template/commands/create.command";

const FrontendFormSchema = CreateDtoBodySchema;
type FrontendForm = z.infer<typeof FrontendFormSchema>;

export const CreateForm = ({
  positionId,

  availableSlotTypes,

  urlOnSuccess,
  urlOnCancel,

  skipErrorCodes,

  className = "",
}: {
  positionId: string;

  availableSlotTypes: {
    id: string;
    name: string;
  }[];

  urlOnSuccess: string;
  urlOnCancel: string;

  skipErrorCodes?: string[];

  className?: string;
}) => {
  const router = useRouter();

  const { mutate: mutateCreate, isPending } = useCreate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FrontendForm>({
    resolver: zodResolver(FrontendFormSchema),
    defaultValues: {
      slot_type_id: "",
      name: "",
      start_time: "",
      duration_minute: 0,
    },
  });

  const startTimeValue = useWatch({
    control,
    name: "start_time",
  });
  const durationValue = useWatch({
    control,
    name: "duration_minute",
  });

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

  const onSubmit = (data: FrontendForm) => {
    mutateCreate(
      {
        positionId: positionId,

        slotTypeId: data.slot_type_id,
        name: data.name,
        startTime: data.start_time,
        durationMinute: data.duration_minute,

        skipErrorCodes: skipErrorCodes,
      },
      {
        onSuccess: () => {
          toast.success("สร้าง slotTemplate เรียบร้อยแล้ว");

          router.push(urlOnSuccess);
        },
        onError: () => {
          toast.error("ไม่สามารถสร้าง slotTemplate ได้ กรุณาลองใหม่อีกครั้ง");
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`bg-white border border-gray-200 rounded-2xl p-8 shadow-sm flex flex-col gap-6 ${className}`}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-bold text-gray-700">
          ชื่อแบบร่าง <span className="text-red-500">*</span>
        </label>

        <input
          id="name"
          type="text"
          {...register("name")}
          placeholder="เช่น แบบร่างเวรเช้า"
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

      <div className="flex flex-col gap-2">
        <label
          htmlFor="slot_type_id"
          className="text-sm font-bold text-gray-700"
        >
          ชนิด/ประเภทกะการทำงาน <span className="text-red-500">*</span>
        </label>

        <select
          id="slot_type_id"
          {...register("slot_type_id")}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
            errors.slot_type_id
              ? "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        >
          {availableSlotTypes.map((ast) => (
            <option key={ast.id} value={ast.id}>
              {ast.name}
            </option>
          ))}
        </select>

        {errors.slot_type_id && (
          <p className="text-sm text-red-500">{errors.slot_type_id.message}</p>
        )}

        <p className="text-xs text-gray-500">
          ชนิด/ประเภทกะการทำงาน จะถูกใช้ในการคำนวณและแสดงผลตารางกะการทำงาน
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="start_time" className="text-sm font-bold text-gray-700">
          เวลาเริ่มงาน
          <span className="text-red-500">*</span>
        </label>
        <input
          id="start_time"
          type="time"
          {...register("start_time")}
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 bg-white focus:ring-2 ${
            errors.start_time
              ? "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />
        {errors.start_time && (
          <p className="text-sm text-red-500">{errors.start_time.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="duration_minute"
          className="text-sm font-bold text-gray-700"
        >
          ระยะเวลา (นาที)
          <span className="text-red-500">*</span>
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
          disabled={isPending}
          className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-gray-50 focus:ring-2 ${
            errors.duration_minute
              ? "border-red-300 focus:ring-red-100 focus:border-red-500"
              : "border-gray-300 focus:ring-purple-100 focus:border-purple-500"
          }`}
        />

        {errors.duration_minute && (
          <p className="text-sm text-red-500">
            {errors.duration_minute.message}
          </p>
        )}
      </div>

      <div
        className={`text-sm px-4 py-3 rounded-lg border transition-all ${
          endTimeDisplay
            ? "bg-blue-50 border-blue-100 text-blue-700"
            : "bg-gray-50 border-gray-100 text-gray-400"
        }`}
      >
        {endTimeDisplay ||
          "กรุณาระบุเวลาเริ่มต้นและระยะเวลา เพื่อดูเวลาเลิกงาน"}
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
