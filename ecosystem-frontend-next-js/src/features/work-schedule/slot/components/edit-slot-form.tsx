"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DateTime } from "luxon";
import { isAxiosError } from "axios";

import { useUpdateSlot } from "../hooks/use-update-slot";
import { useDeleteSlot } from "../hooks/use-delete-slot";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { API_ERROR_MESSAGES } from "@/constants/error-messages";
import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import RedirectUI from "@/components/redirect/redirect-ui";

interface EditSlotFormValues {
  staff_id: string;
  slot_type_id: string;
  actual_start_time: string;
  actual_end_time: string;
}

interface EditSlotFormProps {
  positionId: string;
  placeTimezone: string;
  slot: {
    id: string;
    staffId: string;
    staffName: string;
    slotTypeId: string;
    slotTypeName: string;
    actualStartTime: string;
    actualEndTime: string;
  };
  availableStaffPositions: {
    staffId: string;
    name: string;
  }[];
  availableSlotTypes: {
    id: string;
    name: string;
  }[];
  urlOnSuccess: string;
  urlOnCancel: string;
  errorCodeRedirectList?: Record<string, string>;
  className?: string;
}

export function EditSlotForm({
  positionId,
  placeTimezone,
  slot,
  availableStaffPositions,
  availableSlotTypes,
  urlOnSuccess,
  urlOnCancel,
  errorCodeRedirectList = {},
  className = "",
}: EditSlotFormProps) {
  const router = useRouter();
  const updateSlotMutation = useUpdateSlot();
  const deleteSlotMutation = useDeleteSlot(positionId);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const skipErrorCodes = Object.keys(errorCodeRedirectList);
  const { isRedirecting, targetUrl, errorCode } = useEffectCheckError(
    updateSlotMutation.error ?? deleteSlotMutation.error,
    errorCodeRedirectList,
    undefined,
  );

  // ตรวจสอบว่าค่าปัจจุบันของ staff และ slotType อยู่ในรายการ active หรือไม่
  const isCurrentStaffActive = availableStaffPositions.some(
    (sp) => sp.staffId === slot.staffId,
  );
  const isCurrentSlotTypeActive = availableSlotTypes.some(
    (st) => st.id === slot.slotTypeId,
  );

  // แปลงเวลาเริ่มต้นและสิ้นสุดเป็น format yyyy-MM-dd'T'HH:mm ตาม timezone ของ Place
  const defaultStartTime = DateTime.fromISO(slot.actualStartTime)
    .setZone(placeTimezone)
    .toFormat("yyyy-MM-dd'T'HH:mm");
  const defaultEndTime = DateTime.fromISO(slot.actualEndTime)
    .setZone(placeTimezone)
    .toFormat("yyyy-MM-dd'T'HH:mm");

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<EditSlotFormValues>({
    defaultValues: {
      staff_id: slot.staffId,
      slot_type_id: slot.slotTypeId,
      actual_start_time: defaultStartTime,
      actual_end_time: defaultEndTime,
    },
  });

  const isPending =
    isFormSubmitting ||
    updateSlotMutation.isPending ||
    deleteSlotMutation.isPending ||
    isDeleting;

  const onSubmit = async (data: EditSlotFormValues) => {
    // 1. ตรวจสอบว่า Staff ที่เลือกอยู่ในรายการ active
    const selectedStaffActive = availableStaffPositions.some(
      (sp) => sp.staffId === data.staff_id,
    );
    if (!selectedStaffActive) {
      setError("staff_id", {
        message: "กรุณาเลือกพนักงานที่ active ก่อนบันทึก",
      });
      return;
    }

    // 2. ตรวจสอบว่า Slot Type ที่เลือกอยู่ในรายการ active
    const selectedSlotTypeActive = availableSlotTypes.some(
      (st) => st.id === data.slot_type_id,
    );
    if (!selectedSlotTypeActive) {
      setError("slot_type_id", {
        message: "กรุณาเลือกประเภทกะที่ active ก่อนบันทึก",
      });
      return;
    }

    // 3. Parse วันเวลาตาม timezone ของ Place
    const startDt = DateTime.fromFormat(
      data.actual_start_time,
      "yyyy-MM-dd'T'HH:mm",
      { zone: placeTimezone },
    );
    const endDt = DateTime.fromFormat(
      data.actual_end_time,
      "yyyy-MM-dd'T'HH:mm",
      { zone: placeTimezone },
    );

    if (!startDt.isValid) {
      setError("actual_start_time", {
        message: "รูปแบบเวลาเริ่มต้นไม่ถูกต้อง",
      });
      return;
    }

    if (!endDt.isValid) {
      setError("actual_end_time", {
        message: "รูปแบบเวลาสิ้นสุดไม่ถูกต้อง",
      });
      return;
    }

    if (endDt <= startDt) {
      setError("actual_end_time", {
        message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้นเสมอ",
      });
      return;
    }

    const startIso = startDt.toUTC().toISO();
    const endIso = endDt.toUTC().toISO();

    if (!startIso || !endIso) {
      toast.error("ไม่สามารถแปลงรูปแบบวันเวลาได้ กรุณาตรวจสอบข้อมูล");
      return;
    }

    try {
      deleteSlotMutation.reset();
      await updateSlotMutation.mutateAsync({
        positionId,
        slotId: slot.id,
        skipErrorCodes: skipErrorCodes.length ? skipErrorCodes : undefined,
        data: {
          staff_id: data.staff_id,
          slot_type_id: data.slot_type_id,
          actual_start_time: startIso,
          actual_end_time: endIso,
        },
      });

      toast.success("บันทึกการแก้ไขเวรเรียบร้อยแล้ว");
      router.push(urlOnSuccess);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const errorCode = err.response?.data?.errorCode as
          | ErrorCode
          | undefined;
        if (errorCode && errorCodeRedirectList[errorCode]) return;
        if (errorCode && errorCode in API_ERROR_MESSAGES) {
          toast.error(API_ERROR_MESSAGES[errorCode]);
          return;
        }
        const message = err.response?.data?.message;
        if (message && typeof message === "string") {
          toast.error(message);
          return;
        }
      }
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    updateSlotMutation.reset();
    try {
      await deleteSlotMutation.mutateAsync({
        slotId: slot.id,
        skipErrorCodes: skipErrorCodes.length ? skipErrorCodes : undefined,
      });
      toast.success("ลบรายการเวรเรียบร้อยแล้ว");
      setIsConfirmingDelete(false);
      router.push(urlOnSuccess);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const errorCode = err.response?.data?.errorCode as
          | ErrorCode
          | undefined;
        if (errorCode && errorCodeRedirectList[errorCode]) return;
        if (errorCode && errorCode in API_ERROR_MESSAGES) {
          toast.error(API_ERROR_MESSAGES[errorCode]);
          return;
        }
        const message = err.response?.data?.message;
        if (message && typeof message === "string") {
          toast.error(message);
          return;
        }
      }
      toast.error("เกิดข้อผิดพลาดในการลบรายการเวร กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isRedirecting && targetUrl && errorCode) {
    return <RedirectUI targetUrl={targetUrl} errorCode={errorCode} />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="staff_id" className="text-sm font-bold text-foreground">
            พนักงานผู้ปฏิบัติงาน <span className="text-destructive">*</span>
          </label>
          <select
            id="staff_id"
            {...register("staff_id")}
            disabled={isPending}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background bg-card focus:ring-2 ${
              errors.staff_id
                ? "border-destructive focus:ring-destructive focus:border-destructive"
                : "border-border focus:ring-primary focus:border-ring"
            }`}
          >
            {!isCurrentStaffActive && (
              <option value={slot.staffId}>
                {slot.staffName} (ไม่ active)
              </option>
            )}
            {availableStaffPositions.map((sp) => (
              <option key={sp.staffId} value={sp.staffId}>
                {sp.name}
              </option>
            ))}
          </select>
          {errors.staff_id && (
            <p className="text-sm text-destructive">{errors.staff_id.message}</p>
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
            disabled={isPending}
            className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background bg-card focus:ring-2 ${
              errors.slot_type_id
                ? "border-destructive focus:ring-destructive focus:border-destructive"
                : "border-border focus:ring-primary focus:border-ring"
            }`}
          >
            {!isCurrentSlotTypeActive && (
              <option value={slot.slotTypeId}>
                {slot.slotTypeName} (ไม่ active)
              </option>
            )}
            {availableSlotTypes.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
          {errors.slot_type_id && (
            <p className="text-sm text-destructive">
              {errors.slot_type_id.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="actual_start_time"
              className="text-sm font-bold text-foreground"
            >
              เวลาเริ่มต้น ({placeTimezone}){" "}
              <span className="text-destructive">*</span>
            </label>
            <input
              id="actual_start_time"
              type="datetime-local"
              {...register("actual_start_time")}
              disabled={isPending}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background bg-card focus:ring-2 ${
                errors.actual_start_time
                  ? "border-destructive focus:ring-destructive focus:border-destructive"
                  : "border-border focus:ring-primary focus:border-ring"
              }`}
            />
            {errors.actual_start_time && (
              <p className="text-sm text-destructive">
                {errors.actual_start_time.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="actual_end_time"
              className="text-sm font-bold text-foreground"
            >
              เวลาสิ้นสุด ({placeTimezone}){" "}
              <span className="text-destructive">*</span>
            </label>
            <input
              id="actual_end_time"
              type="datetime-local"
              {...register("actual_end_time")}
              disabled={isPending}
              className={`w-full px-4 py-3 border rounded-xl outline-none transition-all disabled:bg-background bg-card focus:ring-2 ${
                errors.actual_end_time
                  ? "border-destructive focus:ring-destructive focus:border-destructive"
                  : "border-border focus:ring-primary focus:border-ring"
              }`}
            />
            {errors.actual_end_time && (
              <p className="text-sm text-destructive">
                {errors.actual_end_time.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="min-h-11 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => router.push(urlOnCancel)}
              className="min-h-11 px-6 py-2 bg-secondary hover:bg-accent text-secondary-foreground font-medium rounded-xl transition border border-border"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </form>

      {/* Danger Zone: Delete Slot */}
      <div className="bg-card border border-destructive/20 rounded-2xl p-4 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-destructive">
          ลบรายการเวร
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          การลบรายการเวรนี้ไม่สามารถเรียกคืนได้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
        </p>

        <div className="mt-4">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-destructive font-medium">
                ยืนยันการลบรายการเวรนี้?
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="min-h-11 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl transition text-sm disabled:opacity-50"
              >
                {isDeleting ? "กำลังลบ..." : "ใช่, ลบรายการนี้"}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isPending}
                className="min-h-11 px-4 py-2 bg-secondary hover:bg-accent text-secondary-foreground font-medium rounded-xl transition border border-border text-sm"
              >
                ยกเลิก
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={isPending}
              className="min-h-11 px-4 py-2 border border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold rounded-xl transition text-sm disabled:opacity-50"
            >
              ลบรายการเวรนี้
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
