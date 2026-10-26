import { DateTime } from "luxon";

export interface AppliedSlotRange {
  draftStartDateTime: string;
  draftEndDateTime: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export type SlotPeriod = "month" | "week" | "day";

export type DraftSlotRange = Pick<
  AppliedSlotRange,
  "draftStartDateTime" | "draftEndDateTime"
>;

export type SlotPeriodRangeResult =
  | { ok: true; range: DraftSlotRange }
  | { ok: false; error: string };

function moveSlotPeriod(
  reference: DateTime,
  period: SlotPeriod,
  direction: -1 | 0 | 1,
): DateTime {
  switch (period) {
    case "month":
      return reference.plus({ months: direction });
    case "week":
      return reference.plus({ weeks: direction });
    case "day":
      return reference.plus({ days: direction });
  }
}

function buildSlotPeriodRange(
  period: SlotPeriod,
  timezone: string | undefined,
  reference: DateTime | string,
  direction: -1 | 0 | 1,
): SlotPeriodRangeResult {
  if (!timezone) {
    return { ok: false, error: "วันเวลา หรือเขตเวลาไม่ถูกต้อง" };
  }

  const zonedReference =
    typeof reference === "string"
      ? DateTime.fromISO(reference, { zone: timezone })
      : reference.setZone(timezone);

  if (!zonedReference.isValid) {
    return { ok: false, error: "วันเวลา หรือเขตเวลาไม่ถูกต้อง" };
  }

  const start = moveSlotPeriod(
    zonedReference.startOf(period),
    period,
    direction,
  ).startOf(period);
  const end = moveSlotPeriod(start, period, 1).startOf(period);

  if (!start.isValid || !end.isValid) {
    return { ok: false, error: "วันเวลา หรือเขตเวลาไม่ถูกต้อง" };
  }

  return {
    ok: true,
    range: {
      draftStartDateTime: start.toFormat("yyyy-MM-dd'T'HH:mm"),
      draftEndDateTime: end.toFormat("yyyy-MM-dd'T'HH:mm"),
    },
  };
}

export function createSlotPeriodRange(
  period: SlotPeriod,
  timezone: string | undefined,
  reference: DateTime | string = DateTime.now(),
): SlotPeriodRangeResult {
  return buildSlotPeriodRange(period, timezone, reference, 0);
}

export function shiftSlotPeriodRange(
  period: SlotPeriod,
  direction: -1 | 1,
  timezone: string | undefined,
  reference: DateTime | string = DateTime.now(),
): SlotPeriodRangeResult {
  return buildSlotPeriodRange(period, timezone, reference, direction);
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
