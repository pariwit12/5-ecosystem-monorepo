"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { workScheduleHolidayQueries } from "../work-schedule-holiday.queries";
import { useDeleteHoliday } from "../hooks/use-delete-holiday";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { API_ERROR_MESSAGES } from "@/constants/error-messages";

interface HolidayListProps {
  placeId: string;
  placeTimezone: string;
}

export function HolidayList({ placeId, placeTimezone }: HolidayListProps) {
  const { getToken, userId } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery(
    workScheduleHolidayQueries.list(userId, getToken, placeId, [
      ErrorCode.WORK_SCHEDULE_HOLIDAY_NOT_FOUND,
    ]),
  );

  const deleteHolidayMutation = useDeleteHoliday(placeId);

  const handleDelete = async (holidayId: string) => {
    setDeletingId(holidayId);
    try {
      await deleteHolidayMutation.mutateAsync(holidayId);
      toast.success("ลบรายการวันหยุดเรียบร้อยแล้ว");
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const errorCode = err.response?.data?.errorCode as ErrorCode | undefined;
        if (errorCode && errorCode in API_ERROR_MESSAGES) {
          toast.error(API_ERROR_MESSAGES[errorCode]);
          return;
        }
      }
      toast.error("เกิดข้อผิดพลาดในการลบวันหยุด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDeletingId(null);
    }
  };

  const formatPeriod = (startIso: string, endIso: string) => {
    const startDt = DateTime.fromISO(startIso).setZone(placeTimezone);
    const endDt = DateTime.fromISO(endIso).setZone(placeTimezone);

    // ตรวจว่าเป็นเต็มวันหรือไม่ (เริ่ม 00:00:00 สิ้นสุด 00:00:00 วันถัดไป)
    const isStartMidnight =
      startDt.hour === 0 &&
      startDt.minute === 0 &&
      startDt.second === 0;
    const isEndMidnight =
      endDt.hour === 0 &&
      endDt.minute === 0 &&
      endDt.second === 0;
    const isConsecutiveDay =
      endDt.diff(startDt, "days").days >= 0.9 &&
      endDt.diff(startDt, "days").days <= 1.1;

    if (isStartMidnight && isEndMidnight && isConsecutiveDay) {
      return {
        isFullDay: true,
        text: `เต็มวัน: ${startDt.toFormat("dd/MM/yyyy")}`,
      };
    }

    return {
      isFullDay: false,
      text: `${startDt.toFormat("dd/MM/yyyy HH:mm")} - ${endDt.toFormat("dd/MM/yyyy HH:mm")}`,
    };
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">
        รายการวันหยุดของคุณ
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        รายการวันหยุดทั้งหมดที่คุณได้ลงไว้ในสถานที่ทำงานนี้
      </p>

      {isLoading ? (
        <div className="mt-4 text-center py-6 text-sm text-muted-foreground">
          กำลังโหลดรายการวันหยุด...
        </div>
      ) : error ? (
        <div className="mt-4 text-center py-6 text-sm text-destructive">
          ไม่สามารถโหลดรายการวันหยุดได้
        </div>
      ) : !data?.holidays || data.holidays.length === 0 ? (
        <div className="mt-4 text-center py-6 sm:py-8 text-sm text-muted-foreground border border-dashed rounded-xl">
          ยังไม่มีรายการวันหยุดที่บันทึกไว้
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border">
          {data.holidays.map((holiday) => {
            const period = formatPeriod(holiday.startTime, holiday.endTime);
            const isConfirming = confirmDeleteId === holiday.id;
            const isDeleting = deletingId === holiday.id;

            return (
              <div
                key={holiday.id}
                className="flex flex-wrap items-start justify-between gap-3 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        period.isFullDay
                          ? "bg-primary/10 text-primary"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {period.isFullDay ? "เต็มวัน" : "บางช่วงเวลา"}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {period.text}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground block mt-1">
                    บันทึกเมื่อ:{" "}
                    {DateTime.fromISO(holiday.createdAt)
                      .setZone(placeTimezone)
                      .toFormat("dd/MM/yyyy HH:mm")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isConfirming ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-destructive font-medium">
                        ยืนยันการลบ?
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(holiday.id)}
                        disabled={isDeleting}
                        className="min-h-11 rounded-lg bg-destructive px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-destructive disabled:opacity-50"
                      >
                        {isDeleting ? "กำลังลบ..." : "ใช่, ลบ"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className="min-h-11 rounded-lg bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground transition hover:bg-accent"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(holiday.id)}
                      className="min-h-11 rounded-lg border border-border px-3 py-1 text-xs font-semibold text-destructive transition hover:border-destructive hover:bg-destructive/10"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
