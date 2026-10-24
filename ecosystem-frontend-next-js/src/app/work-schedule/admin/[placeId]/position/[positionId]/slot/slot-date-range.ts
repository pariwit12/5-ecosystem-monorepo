import { DateTime } from "luxon";

export interface AppliedSlotRange {
  draftStartDateTime: string;
  draftEndDateTime: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export type ParseSlotDateRangeResult =
  | { ok: true; range: AppliedSlotRange }
  | { ok: false; error: string };

export function parseSlotDateRange(
  start: string,
  end: string,
  timezone: string | undefined,
): ParseSlotDateRangeResult {
  if (!start || !end) {
    return { ok: false, error: "กรุณาระบุวันและเวลาเริ่มต้นและสิ้นสุด" };
  }

  if (!timezone) {
    return { ok: false, error: "วันเวลา หรือเขตเวลาไม่ถูกต้อง" };
  }

  const dtStart = DateTime.fromISO(start, { zone: timezone });
  const dtEnd = DateTime.fromISO(end, { zone: timezone });

  if (!dtStart.isValid || !dtEnd.isValid) {
    return { ok: false, error: "วันเวลา หรือเขตเวลาไม่ถูกต้อง" };
  }

  if (dtStart.toMillis() >= dtEnd.toMillis()) {
    return { ok: false, error: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น" };
  }

  const isoStart = dtStart.toUTC().toISO();
  const isoEnd = dtEnd.toUTC().toISO();

  if (!isoStart || !isoEnd) {
    return { ok: false, error: "วันเวลา หรือเขตเวลาไม่ถูกต้อง" };
  }

  return {
    ok: true,
    range: {
      draftStartDateTime: start,
      draftEndDateTime: end,
      startTime: isoStart,
      endTime: isoEnd,
      timezone,
    },
  };
}

export function formatSlotDateRange(range: AppliedSlotRange): string {
  const formattedStart = DateTime.fromISO(range.startTime, {
    zone: range.timezone,
  }).toFormat("dd/MM/yyyy HH:mm");
  const formattedEnd = DateTime.fromISO(range.endTime, {
    zone: range.timezone,
  }).toFormat("dd/MM/yyyy HH:mm");
  return `${formattedStart} – ${formattedEnd} (${range.timezone})`;
}
