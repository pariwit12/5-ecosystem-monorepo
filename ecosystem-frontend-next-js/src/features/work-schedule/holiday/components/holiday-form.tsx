"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useCreateHoliday } from "../hooks/use-create-holiday";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { API_ERROR_MESSAGES } from "@/constants/error-messages";

interface HolidayFormProps {
  placeId: string;
  placeTimezone: string;
}

export function HolidayForm({ placeId, placeTimezone }: HolidayFormProps) {
  const [type, setType] = useState<"FULL_DAY" | "PARTIAL">("FULL_DAY");
  const [date, setDate] = useState("");
  const [startTimeLocal, setStartTimeLocal] = useState("");
  const [endTimeLocal, setEndTimeLocal] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createHolidayMutation = useCreateHoliday(placeId);

  const validateAndConvertPartialTime = (
    value: string,
    fieldName: string,
  ): string | null => {
    if (!value) {
      setErrorMessage(`กรุณาระบุ${fieldName}`);
      return null;
    }

    const dt = DateTime.fromFormat(value, "yyyy-MM-dd'T'HH:mm", {
      zone: placeTimezone,
    });

    if (!dt.isValid) {
      setErrorMessage(`${fieldName}ไม่ถูกต้องตามปฏิทิน`);
      return null;
    }

    // Check round-trip to detect if Luxon shifted invalid local time (DST spring forward)
    if (dt.toFormat("yyyy-MM-dd'T'HH:mm") !== value) {
      setErrorMessage(
        `${fieldName}เป็นเวลาที่ไม่มีอยู่จริงเนื่องจากช่วงปรับเวลา Daylight Saving Time (DST) ของสถานที่ กรุณาเลือกเวลาอื่น`,
      );
      return null;
    }

    // Check ambiguous time (DST fall back)
    if (dt.getPossibleOffsets().length !== 1) {
      setErrorMessage(
        `${fieldName}เป็นเวลาที่มีความกำกวมช่วงปรับเวลา Daylight Saving Time (DST) ของสถานที่ กรุณาเลือกเวลาอื่น`,
      );
      return null;
    }

    const isoString = dt.toUTC().toISO();
    if (!isoString) {
      setErrorMessage(`ไม่สามารถแปลง${fieldName}เป็น ISO format ได้`);
      return null;
    }

    return isoString;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (type === "FULL_DAY") {
      if (!date) {
        setErrorMessage("กรุณาเลือกวันที่ต้องการหยุด");
        return;
      }

      const dt = DateTime.fromISO(date, { zone: placeTimezone });
      if (!dt.isValid) {
        setErrorMessage("วันที่ไม่ถูกต้องตามปฏิทิน");
        return;
      }

      try {
        await createHolidayMutation.mutateAsync({
          type: "FULL_DAY",
          date,
        });
        toast.success("บันทึกวันหยุดเต็มวันเรียบร้อยแล้ว");
        setDate("");
      } catch (err: unknown) {
        handleError(err);
      }
    } else {
      const startIso = validateAndConvertPartialTime(
        startTimeLocal,
        "เวลาเริ่มต้น",
      );
      if (!startIso) return;

      const endIso = validateAndConvertPartialTime(
        endTimeLocal,
        "เวลาสิ้นสุด",
      );
      if (!endIso) return;

      if (new Date(startIso).getTime() >= new Date(endIso).getTime()) {
        setErrorMessage("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น");
        return;
      }

      try {
        await createHolidayMutation.mutateAsync({
          type: "PARTIAL",
          start_time: startIso,
          end_time: endIso,
        });
        toast.success("บันทึกวันหยุดบางช่วงเวลาเรียบร้อยแล้ว");
        setStartTimeLocal("");
        setEndTimeLocal("");
      } catch (err: unknown) {
        handleError(err);
      }
    }
  };

  const handleError = (err: unknown) => {
    if (isAxiosError(err)) {
      const errorCode = err.response?.data?.errorCode as ErrorCode | undefined;
      if (errorCode && errorCode in API_ERROR_MESSAGES) {
        setErrorMessage(API_ERROR_MESSAGES[errorCode]);
        return;
      }
      if (err.response?.data?.message) {
        setErrorMessage(
          Array.isArray(err.response.data.message)
            ? err.response.data.message.join(", ")
            : err.response.data.message,
        );
        return;
      }
    }
    setErrorMessage("เกิดข้อผิดพลาดในการบันทึกวันหยุด กรุณาลองใหม่อีกครั้ง");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">
        ลงบันทึกวันหยุดของตนเอง
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        รายการวันหยุดจะมีผลทันทีและไม่สามารถซ้ำซ้อนกับเวรการทำงานที่มีอยู่ได้ (เวลาอิงตาม {placeTimezone})
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
            <input
              type="radio"
              name="holidayType"
              value="FULL_DAY"
              checked={type === "FULL_DAY"}
              onChange={() => {
                setType("FULL_DAY");
                setErrorMessage(null);
              }}
              className="h-4 w-4 text-primary focus:ring-primary"
            />
            เต็มวัน (Full Day)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
            <input
              type="radio"
              name="holidayType"
              value="PARTIAL"
              checked={type === "PARTIAL"}
              onChange={() => {
                setType("PARTIAL");
                setErrorMessage(null);
              }}
              className="h-4 w-4 text-primary focus:ring-primary"
            />
            บางช่วงเวลา (Partial Time)
          </label>
        </div>

        {type === "FULL_DAY" ? (
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              เลือกวันที่
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                วันและเวลาเริ่มต้น ({placeTimezone})
              </label>
              <input
                type="datetime-local"
                value={startTimeLocal}
                onChange={(e) => setStartTimeLocal(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                วันและเวลาสิ้นสุด ({placeTimezone})
              </label>
              <input
                type="datetime-local"
                value={endTimeLocal}
                onChange={(e) => setEndTimeLocal(e.target.value)}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createHolidayMutation.isPending}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-primary/20 disabled:cursor-not-allowed sm:w-auto"
          >
            {createHolidayMutation.isPending ? "กำลังบันทึก..." : "บันทึกวันหยุด"}
          </button>
        </div>
      </form>
    </div>
  );
}
