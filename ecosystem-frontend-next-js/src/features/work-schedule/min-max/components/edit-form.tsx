"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { DateTime } from "luxon";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { UpdateDtoBodySchema } from "@backend/modules/work-schedule/min-max/commands/update.command";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { API_ERROR_MESSAGES } from "@/constants/error-messages";
import { useEffectCheckError } from "@/hooks/use-effect-check-error";
import RedirectUI from "@/components/redirect/redirect-ui";
import { useUpdate } from "../hooks/use-update";
import { useDelete } from "../hooks/use-delete";

interface EditFormValues {
  min: string;
  max: string;
  start_time: string;
  end_time: string;
}

interface EditFormProps {
  positionId: string;
  placeTimezone: string;
  minMax: {
    id: string;
    min: number | null;
    max: number | null;
    startTime: string;
    endTime: string;
  };
  urlOnSuccess: string;
  urlOnCancel: string;
  errorCodeRedirectList?: Record<string, string>;
}

export function EditForm({
  positionId,
  placeTimezone,
  minMax,
  urlOnSuccess,
  urlOnCancel,
  errorCodeRedirectList = {},
}: EditFormProps) {
  const router = useRouter();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete(positionId);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isMutating = useRef(false);
  const skipErrorCodes = Object.keys(errorCodeRedirectList);

  const { isRedirecting, targetUrl, errorCode } = useEffectCheckError(
    updateMutation.error ?? deleteMutation.error,
    errorCodeRedirectList,
    undefined,
  );

  const toLocalTime = (isoTime: string) =>
    DateTime.fromISO(isoTime)
      .setZone(placeTimezone)
      .toISO({
        includeOffset: false,
        suppressSeconds: true,
        suppressMilliseconds: true,
      }) ?? "";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    defaultValues: {
      min: minMax.min === null ? "" : String(minMax.min),
      max: minMax.max === null ? "" : String(minMax.max),
      start_time: toLocalTime(minMax.startTime),
      end_time: toLocalTime(minMax.endTime),
    },
  });

  const isPending =
    isSubmitting || updateMutation.isPending || deleteMutation.isPending;

  const showMutationError = (error: unknown, fallbackMessage: string) => {
    if (isAxiosError(error)) {
      const code = error.response?.data?.errorCode as ErrorCode | undefined;
      if (code && errorCodeRedirectList[code]) return;
      if (code && code in API_ERROR_MESSAGES) {
        toast.error(API_ERROR_MESSAGES[code]);
        return;
      }
      const message = error.response?.data?.message;
      if (typeof message === "string") {
        toast.error(message);
        return;
      }
    }
    toast.error(fallbackMessage);
  };

  const onSubmit = async (values: EditFormValues) => {
    if (isMutating.current) return;

    const body = UpdateDtoBodySchema.safeParse({
      min: values.min === "" ? null : Number(values.min),
      max: values.max === "" ? null : Number(values.max),
      start_time:
        DateTime.fromISO(values.start_time, { zone: placeTimezone })
          .toUTC()
          .toISO() ?? "",
      end_time:
        DateTime.fromISO(values.end_time, { zone: placeTimezone })
          .toUTC()
          .toISO() ?? "",
    });

    if (!body.success) {
      for (const issue of body.error.issues) {
        const field = issue.path[0];
        if (
          field === "min" ||
          field === "max" ||
          field === "start_time" ||
          field === "end_time"
        ) {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    isMutating.current = true;
    deleteMutation.reset();
    try {
      await updateMutation.mutateAsync({
        positionId,
        minMaxId: minMax.id,
        data: body.data,
        skipErrorCodes: skipErrorCodes.length ? skipErrorCodes : undefined,
      });
      toast.success("บันทึกการแก้ไข min/max เรียบร้อยแล้ว");
      router.push(urlOnSuccess);
    } catch (error: unknown) {
      showMutationError(error, "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      isMutating.current = false;
    }
  };

  const handleDelete = async () => {
    if (isMutating.current) return;
    isMutating.current = true;
    updateMutation.reset();
    try {
      await deleteMutation.mutateAsync({
        minMaxId: minMax.id,
        skipErrorCodes: skipErrorCodes.length ? skipErrorCodes : undefined,
      });
      toast.success("ลบรายการ min/max เรียบร้อยแล้ว");
      setIsConfirmingDelete(false);
      router.push(urlOnSuccess);
    } catch (error: unknown) {
      showMutationError(error, "ลบรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      isMutating.current = false;
    }
  };

  if (isRedirecting && targetUrl && errorCode) {
    return <RedirectUI targetUrl={targetUrl} errorCode={errorCode} />;
  }

  return (
    <div className="space-y-6">
      <form
        noValidate
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
        className="bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="min" className="text-sm font-bold text-foreground">
            ปริมาณพนักงานต่ำสุด (คน)
          </label>
          <input
            id="min"
            type="number"
            min="0"
            step="1"
            {...register("min")}
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
            step="1"
            {...register("max")}
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
            เวลาเริ่มต้น ({placeTimezone}) <span className="text-destructive">*</span>
          </label>
          <input
            id="start_time"
            type="datetime-local"
            step="0.001"
            {...register("start_time")}
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
            เวลาสิ้นสุด ({placeTimezone}) <span className="text-destructive">*</span>
          </label>
          <input
            id="end_time"
            type="datetime-local"
            step="0.001"
            {...register("end_time")}
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
            {isSubmitting || updateMutation.isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </form>

      <div className="bg-card border border-destructive/20 rounded-2xl p-4 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-destructive">ลบรายการ min/max</h3>
        <p className="text-xs text-muted-foreground mt-1">
          การลบรายการนี้ไม่สามารถเรียกคืนได้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
        </p>
        <div className="mt-4">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-destructive font-medium">
                ยืนยันการลบรายการ min/max นี้?
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="min-h-11 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl transition text-sm disabled:opacity-50"
              >
                {deleteMutation.isPending ? "กำลังลบ..." : "ใช่, ลบรายการนี้"}
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
              ลบรายการ min/max นี้
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
