"use client";

import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SlotTypeSelect } from "./component-work-schedule-board-component-slot-type-selector";

interface StaffPosition {
  staffId: string;
  name: string;
}

interface Slot {
  id: string;
  staffId: string;
  staffName: string;
  slotTypeId: string;
  slotTypeName: string;
  actualStartTime: string;
  actualEndTime: string;
}

interface MinMax {
  id: string;
  min: number | null;
  max: number | null;
  startTime: string;
  endTime: string;
}

interface WorkScheduleHoliday {
  id: string;
  staffId: string;
  startTime: string;
  endTime: string;
}

interface WorkScheduleBoardProps {
  slots: Slot[];
  minMaxs: MinMax[];
  workScheduleHolidays: WorkScheduleHoliday[];
  staffPositions: StaffPosition[];
  startDateTime: string; // ISO String เริ่มต้นของกระดาน
  endDateTime: string; // ISO String สิ้นสุดของกระดาน
  placeId: string;
  positionId: string;
  timezone: string; // Timezone ของ place
}

interface ClippedInterval {
  start: number;
  end: number;
}

function clipInterval(
  startTime: string,
  endTime: string,
  startMs: number,
  endMs: number,
  timezone: string,
): ClippedInterval | null {
  const start = Math.max(
    startMs,
    DateTime.fromISO(startTime, { zone: timezone }).toMillis(),
  );
  const end = Math.min(
    endMs,
    DateTime.fromISO(endTime, { zone: timezone }).toMillis(),
  );

  return end > start ? { start, end } : null;
}

function summarizeWork(
  slots: Slot[],
  startMs: number,
  endMs: number,
  timezone: string,
) {
  let shiftCount = 0;
  let durationMs = 0;

  for (const slot of slots) {
    const interval = clipInterval(
      slot.actualStartTime,
      slot.actualEndTime,
      startMs,
      endMs,
      timezone,
    );
    if (!interval) continue;

    shiftCount++;
    durationMs += interval.end - interval.start;
  }

  return { shiftCount, durationMs };
}

function getHolidayDuration(
  holidays: WorkScheduleHoliday[],
  startMs: number,
  endMs: number,
  timezone: string,
) {
  const intervals = holidays
    .map((holiday) =>
      clipInterval(holiday.startTime, holiday.endTime, startMs, endMs, timezone),
    )
    .filter((interval): interval is ClippedInterval => interval !== null)
    .sort((a, b) => a.start - b.start);

  let merged: ClippedInterval | null = null;
  let durationMs = 0;

  for (const interval of intervals) {
    if (merged && interval.start <= merged.end) {
      merged.end = Math.max(merged.end, interval.end);
    } else {
      if (merged) durationMs += merged.end - merged.start;
      merged = interval;
    }
  }
  if (merged) durationMs += merged.end - merged.start;

  return durationMs;
}

function formatDuration(durationMs: number) {
  const totalMinutes = Math.floor(durationMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours} ชม. ${minutes} นาที`;
}

export function WorkScheduleBoard({
  slots,
  minMaxs,
  workScheduleHolidays,
  staffPositions,
  startDateTime,
  endDateTime,
  placeId,
  positionId,
  timezone,
}: WorkScheduleBoardProps) {
  // State สำหรับเก็บ slotTypeId ที่เลือก
  const [selectedSlotTypeId, setSelectedSlotTypeId] = useState<string>("all");

  // รวบรวม slotType ทั้งหมดที่ไม่ซ้ำกันจากข้อมูล slots
  const availableSlotTypes = useMemo(() => {
    const typesMap = new Map<string, string>();
    slots.forEach((slot) => {
      if (slot.slotTypeId && !typesMap.has(slot.slotTypeId)) {
        typesMap.set(slot.slotTypeId, slot.slotTypeName);
      }
    });

    return Array.from(typesMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [slots]);

  // กรอง slots ตาม slotTypeId ที่เลือก
  const filteredSlots = useMemo(() => {
    if (selectedSlotTypeId === "all") {
      return slots;
    }
    return slots.filter((slot) => slot.slotTypeId === selectedSlotTypeId);
  }, [slots, selectedSlotTypeId]);

  // 1. จัดกลุ่มพนักงาน (แกน Y)
  const rows = useMemo(() => {
    const staffMap = new Map<
      string,
      {
        id: string;
        name: string;
        isExtra: boolean;
        slots: Slot[];
        holidays: WorkScheduleHoliday[];
      }
    >();

    staffPositions.forEach((sp) => {
      staffMap.set(sp.staffId, {
        id: sp.staffId,
        name: sp.name,
        isExtra: false,
        slots: [],
        holidays: [],
      });
    });

    workScheduleHolidays.forEach((holiday) => {
      staffMap.get(holiday.staffId)?.holidays.push(holiday);
    });

    const unassignedSlots: Slot[] = [];

    filteredSlots.forEach((slot) => {
      if (!slot.staffId) {
        unassignedSlots.push(slot);
        return;
      }

      if (!staffMap.has(slot.staffId)) {
        staffMap.set(slot.staffId, {
          id: slot.staffId,
          name: slot.slotTypeName,
          isExtra: true,
          slots: [],
          holidays: [],
        });
      }

      staffMap.get(slot.staffId)!.slots.push(slot);
    });

    const result = Array.from(staffMap.values());

    if (unassignedSlots.length > 0) {
      result.push({
        id: "unassigned",
        name: "ยังไม่ระบุพนักงาน",
        isExtra: true,
        slots: unassignedSlots,
        holidays: [],
      });
    }

    return result;
  }, [filteredSlots, staffPositions, workScheduleHolidays]);

  // 2. ข้อมูลระยะเวลาและฟังก์ชันคำนวณพิกัดแกน X (อิงตาม timezone)
  const startMs = DateTime.fromISO(startDateTime, {
    zone: timezone,
  }).toMillis();
  const endMs = DateTime.fromISO(endDateTime, { zone: timezone }).toMillis();
  const totalDurationMs = endMs - startMs;

  const rowsWithSummaries = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        summary:
          row.id === "unassigned"
            ? null
            : {
                work: summarizeWork(row.slots, startMs, endMs, timezone),
                holidayDurationMs: getHolidayDuration(
                  row.holidays,
                  startMs,
                  endMs,
                  timezone,
                ),
              },
      })),
    [rows, startMs, endMs, timezone],
  );

  const getCoordinates = (startTimeISO: string, endTimeISO: string) => {
    const sMs = DateTime.fromISO(startTimeISO, { zone: timezone }).toMillis();
    const eMs = DateTime.fromISO(endTimeISO, { zone: timezone }).toMillis();

    const boundedStart = Math.max(startMs, sMs);
    const boundedEnd = Math.min(endMs, eMs);

    const left = ((boundedStart - startMs) / totalDurationMs) * 100;
    const right = ((boundedEnd - startMs) / totalDurationMs) * 100;
    const width = right - left;

    return {
      left: `${left}%`,
      width: `${width}%`,
      isClippedLeft: sMs < startMs,
      isClippedRight: eMs > endMs,
    };
  };

  // 3. สร้างช่วงเวลาย่อยเฉพาะจุดที่มี "คนขึ้นหรือลงเวร" สำหรับแถวรวมคนทำงานจริง
  const staffChangeSlices = useMemo(() => {
    if (totalDurationMs <= 0) return [];

    const pointsSet = new Set<number>([startMs, endMs]);

    filteredSlots.forEach((slot) => {
      const s = DateTime.fromISO(slot.actualStartTime, {
        zone: timezone,
      }).toMillis();
      const e = DateTime.fromISO(slot.actualEndTime, {
        zone: timezone,
      }).toMillis();
      if (s >= startMs && s <= endMs) pointsSet.add(s);
      if (e >= startMs && e <= endMs) pointsSet.add(e);
    });

    const sortedPoints = Array.from(pointsSet).sort((a, b) => a - b);
    const slices = [];

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const sliceStartMs = sortedPoints[i];
      const sliceEndMs = sortedPoints[i + 1];

      if (sliceStartMs >= sliceEndMs) continue;

      const sliceStartISO = DateTime.fromMillis(sliceStartMs, {
        zone: timezone,
      })
        .toUTC()
        .toISO()!;
      const sliceEndISO = DateTime.fromMillis(sliceEndMs, { zone: timezone })
        .toUTC()
        .toISO()!;

      let currentCount = 0;
      filteredSlots.forEach((slot) => {
        const sMs = DateTime.fromISO(slot.actualStartTime, {
          zone: timezone,
        }).toMillis();
        const eMs = DateTime.fromISO(slot.actualEndTime, {
          zone: timezone,
        }).toMillis();
        if (sMs < sliceEndMs && eMs > sliceStartMs) {
          currentCount++;
        }
      });

      slices.push({
        id: `${sliceStartMs}-${sliceEndMs}`,
        startTime: sliceStartISO,
        endTime: sliceEndISO,
        currentCount,
      });
    }

    return slices;
  }, [filteredSlots, startMs, endMs, totalDurationMs, timezone]);

  // 4. สร้างช่วงเวลาและคำนวณสถานะสำหรับแถว "เปรียบเทียบเกณฑ์" (Compare Row)
  const compareSlices = useMemo(() => {
    if (totalDurationMs <= 0) return [];

    // เก็บจุดตัดเวลาทั้งจาก Slot และ MinMax เพื่อแบ่งช่วงประมวลผลอย่างแม่นยำ
    const pointsSet = new Set<number>([startMs, endMs]);

    slots.forEach((slot) => {
      const s = DateTime.fromISO(slot.actualStartTime, {
        zone: timezone,
      }).toMillis();
      const e = DateTime.fromISO(slot.actualEndTime, {
        zone: timezone,
      }).toMillis();
      if (s >= startMs && s <= endMs) pointsSet.add(s);
      if (e >= startMs && e <= endMs) pointsSet.add(e);
    });

    minMaxs.forEach((mm) => {
      const s = DateTime.fromISO(mm.startTime, { zone: timezone }).toMillis();
      const e = DateTime.fromISO(mm.endTime, { zone: timezone }).toMillis();
      if (s >= startMs && s <= endMs) pointsSet.add(s);
      if (e >= startMs && e <= endMs) pointsSet.add(e);
    });

    const sortedPoints = Array.from(pointsSet).sort((a, b) => a - b);
    const slices = [];

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const sliceStartMs = sortedPoints[i];
      const sliceEndMs = sortedPoints[i + 1];

      if (sliceStartMs >= sliceEndMs) continue;

      const sliceStartISO = DateTime.fromMillis(sliceStartMs, {
        zone: timezone,
      })
        .toUTC()
        .toISO()!;
      const sliceEndISO = DateTime.fromMillis(sliceEndMs, { zone: timezone })
        .toUTC()
        .toISO()!;

      // จำนวนคนทำงานจริงในช่วงนี้
      let currentCount = 0;
      slots.forEach((slot) => {
        const sMs = DateTime.fromISO(slot.actualStartTime, {
          zone: timezone,
        }).toMillis();
        const eMs = DateTime.fromISO(slot.actualEndTime, {
          zone: timezone,
        }).toMillis();
        if (sMs < sliceEndMs && eMs > sliceStartMs) {
          currentCount++;
        }
      });

      // ค้นหาเกณฑ์ Min/Max ที่ครอบคลุมช่วงเวลานี้
      const activeMinMax = minMaxs.find((mm) => {
        const mmS = DateTime.fromISO(mm.startTime, {
          zone: timezone,
        }).toMillis();
        const mmE = DateTime.fromISO(mm.endTime, {
          zone: timezone,
        }).toMillis();
        return mmS < sliceEndMs && mmE > sliceStartMs;
      });

      let status: "normal" | "low" | "high" | "none" = "none";
      let label = "-";

      if (activeMinMax) {
        const min = activeMinMax.min;
        const max = activeMinMax.max;

        if (min !== null && currentCount < min) {
          status = "low";
          label = `ขาด ${min - currentCount} คน`;
        } else if (max !== null && currentCount > max) {
          status = "high";
          label = `เกิน ${currentCount - max} คน`;
        } else {
          status = "normal";
          label = "ตามเกณฑ์";
        }
      }

      slices.push({
        id: `${sliceStartMs}-${sliceEndMs}`,
        startTime: sliceStartISO,
        endTime: sliceEndISO,
        currentCount,
        status,
        label,
        min: activeMinMax?.min ?? null,
        max: activeMinMax?.max ?? null,
      });
    }

    return slices;
  }, [slots, minMaxs, startMs, endMs, totalDurationMs, timezone]);

  // 5. สร้าง Markers เฉพาะวันที่ (dd/MM) รายวัน
  const markers = useMemo(() => {
    if (totalDurationMs <= 0) return [];

    const newMarkers = [];
    let current = DateTime.fromMillis(startMs, { zone: timezone }).startOf(
      "day",
    );

    while (current.toMillis() <= endMs) {
      const posMs = current.toMillis() - startMs;
      const percent = (posMs / totalDurationMs) * 100;

      if (percent >= 0 && percent <= 100) {
        newMarkers.push({
          id: current.toMillis().toString(),
          label: current.toFormat("dd/MM"),
          percent,
        });
      }

      current = current.plus({ days: 1 });
    }

    return newMarkers;
  }, [startMs, endMs, totalDurationMs, timezone]);

  if (totalDurationMs <= 0) {
    return (
      <div className="text-center text-destructive p-4">
        ช่วงเวลาที่เลือกไม่ถูกต้อง
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* วาง UI Component ตัวเลือกไว้ด้านบนกระดาน */}
      <div className="flex flex-wrap justify-start sm:justify-end">
        <SlotTypeSelect
          value={selectedSlotTypeId}
          onChange={setSelectedSlotTypeId}
          options={availableSlotTypes}
        />
      </div>

      <div
        className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
        role="region"
        aria-label="กระดานตารางเวลา เลื่อนแนวนอนเพื่อดูข้อมูลเพิ่มเติม"
        tabIndex={0}
      >
      <div className="min-w-[720px] overflow-hidden rounded-xl flex flex-col">
        {/* Header Section */}
        <div className="bg-background border-b border-border flex text-sm text-muted-foreground font-medium">
          <div className="w-24 sm:w-32 md:w-40 lg:w-48 shrink-0 border-r border-border p-3 flex items-center">
            <span className="font-semibold text-foreground">รายชื่อพนักงาน</span>
          </div>

          <div className="grow relative min-h-11 overflow-hidden">
            {markers.map((m) => (
              <div
                key={m.id}
                className="absolute top-0 bottom-0 border-l border-border pl-1 pt-2 flex flex-col text-[10px] text-muted-foreground"
                style={{ left: `${m.percent}%` }}
              >
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body Section (Rows) */}
        <div className="divide-y divide-border overflow-y-auto max-h-150">
          {rowsWithSummaries.map((row) => (
            <div
              key={row.id}
              className="flex min-h-16 hover:bg-muted/50 transition-colors group relative"
            >
              <div className="w-24 sm:w-32 md:w-40 lg:w-48 shrink-0 border-r border-border p-3 flex flex-col justify-center bg-card group-hover:bg-transparent z-10">
                <span className="text-sm font-semibold text-foreground line-clamp-2">
                  {row.name}
                </span>
                {row.isExtra && row.id !== "unassigned" && (
                  <span className="text-[10px] text-amber-600 font-medium bg-amber-50 rounded px-1.5 py-0.5 mt-1 w-fit">
                    พนักงานนอกลิสต์
                  </span>
                )}
                {row.summary && (
                  <div className="mt-1 space-y-0.5 text-[10px] leading-relaxed text-muted-foreground">
                    <p>
                      เวร: {row.summary.work.shiftCount} เวร · ทำงาน:{" "}
                      {formatDuration(row.summary.work.durationMs)}
                    </p>
                    <p>หยุด: {formatDuration(row.summary.holidayDurationMs)}</p>
                  </div>
                )}
              </div>

              <div className="grow relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  {markers.map((m) => (
                    <div
                      key={m.id}
                      className="absolute top-0 bottom-0 border-l border-border/70"
                      style={{ left: `${m.percent}%` }}
                    />
                  ))}
                </div>

                {row.slots.map((slot) => {
                  const coords = getCoordinates(
                    slot.actualStartTime,
                    slot.actualEndTime,
                  );

                  if (parseFloat(coords.width) <= 0) return null;

                  const startFormatted = DateTime.fromISO(
                    slot.actualStartTime,
                    {
                      zone: timezone,
                    },
                  ).toFormat("dd/MM HH:mm");
                  const endFormatted = DateTime.fromISO(slot.actualEndTime, {
                    zone: timezone,
                  }).toFormat("dd/MM HH:mm");
                  const startTimeOnly = DateTime.fromISO(slot.actualStartTime, {
                    zone: timezone,
                  }).toFormat("HH:mm");
                  const endTimeOnly = DateTime.fromISO(slot.actualEndTime, {
                    zone: timezone,
                  }).toFormat("HH:mm");

                  return (
                    <Link
                      key={slot.id}
                      href={`/work-schedule/admin/${placeId}/position/${positionId}/slot/${slot.id}`}
                      style={{ left: coords.left, width: coords.width }}
                      className={cn(
                        "absolute top-2 bottom-2 bg-primary/10 rounded text-primary",
                        "py-1.5 shadow-sm hover:shadow-md hover:bg-primary/20 transition-all duration-200 flex flex-col overflow-hidden text-xs z-10",
                        coords.isClippedLeft &&
                          "rounded-l-none border-l-0 border-dashed border-l-primary",
                        coords.isClippedRight &&
                          "rounded-r-none border-r-2 border-dashed border-r-primary",
                      )}
                      title={`${slot.slotTypeName} (${startFormatted} - ${endFormatted})`}
                    >
                      <span className="font-semibold truncate">
                        {slot.slotTypeName}
                      </span>
                      <span className="text-[10px] opacity-75 truncate">
                        {startTimeOnly} - {endTimeOnly}
                      </span>
                    </Link>
                  );
                })}

                {row.holidays.map((holiday) => {
                  const coords = getCoordinates(
                    holiday.startTime,
                    holiday.endTime,
                  );
                  if (parseFloat(coords.width) <= 0) return null;

                  const startFormatted = DateTime.fromISO(holiday.startTime, {
                    zone: timezone,
                  }).toFormat("dd/MM HH:mm");
                  const endFormatted = DateTime.fromISO(holiday.endTime, {
                    zone: timezone,
                  }).toFormat("dd/MM HH:mm");

                  return (
                    <div
                      key={holiday.id}
                      role="note"
                      aria-label={`วันหยุดของ ${row.name} ${startFormatted} ถึง ${endFormatted}`}
                      title={`วันหยุด: ${row.name} (${startFormatted} - ${endFormatted})`}
                      style={{ left: coords.left, width: coords.width }}
                      className={cn(
                        "absolute top-1 bottom-1 rounded border border-rose-400 bg-rose-100/95 px-1 text-rose-900",
                        "flex flex-col justify-center overflow-hidden text-[10px] z-20",
                        coords.isClippedLeft &&
                          "rounded-l-none border-l-2 border-dashed",
                        coords.isClippedRight &&
                          "rounded-r-none border-r-2 border-dashed",
                      )}
                    >
                      <span className="font-semibold truncate">วันหยุด</span>
                      <span className="truncate">
                        {DateTime.fromISO(holiday.startTime, {
                          zone: timezone,
                        }).toFormat("HH:mm")}{" "}
                        -{" "}
                        {DateTime.fromISO(holiday.endTime, {
                          zone: timezone,
                        }).toFormat("HH:mm")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* แถวที่ 1: รวมคนทำงานจริง */}
          <div className="flex min-h-12 bg-muted/50 transition-colors relative border-t border-border">
            <div className="w-24 sm:w-32 md:w-40 lg:w-48 shrink-0 border-r border-border p-3 flex flex-col justify-center bg-muted z-10">
              <span className="text-xs font-bold text-foreground">
                รวมคนทำงานจริง
              </span>
              <span className="text-[10px] text-muted-foreground">
                จำนวนพนักงาน (คน)
              </span>
            </div>

            <div className="grow relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                {markers.map((m) => (
                  <div
                    key={m.id}
                    className="absolute top-0 bottom-0 border-l border-border/70"
                    style={{ left: `${m.percent}%` }}
                  />
                ))}
              </div>

              {staffChangeSlices.map((slice) => {
                const coords = getCoordinates(slice.startTime, slice.endTime);
                if (parseFloat(coords.width) <= 0) return null;

                const startFormatted = DateTime.fromISO(slice.startTime, {
                  zone: timezone,
                }).toFormat("dd/MM HH:mm");
                const endFormatted = DateTime.fromISO(slice.endTime, {
                  zone: timezone,
                }).toFormat("dd/MM HH:mm");

                return (
                  <div
                    key={`count-${slice.id}`}
                    style={{ left: coords.left, width: coords.width }}
                    className="absolute top-1.5 bottom-1.5 bg-primary/10 border border-primary/20 rounded flex items-center justify-center text-xs text-primary font-semibold z-10 shadow-2xs truncate"
                    title={`ช่วงเวลา: ${startFormatted} - ${endFormatted} | ทำงานอยู่: ${slice.currentCount} คน`}
                  >
                    <span className="truncate">{slice.currentCount} คน</span>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedSlotTypeId === "all" && (
            <>
              {/* แถวที่ 2: เปรียบเทียบเกณฑ์ (Compare Row) */}
              <div className="flex min-h-12 bg-muted/80 transition-colors relative border-t border-border">
                <div className="w-24 sm:w-32 md:w-40 lg:w-48 shrink-0 border-r border-border p-3 flex flex-col justify-center bg-muted z-10">
                  <span className="text-xs font-bold text-foreground">
                    เปรียบเทียบเกณฑ์
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    สถานะอัตรากำลัง
                  </span>
                </div>

                <div className="grow relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    {markers.map((m) => (
                      <div
                        key={m.id}
                        className="absolute top-0 bottom-0 border-l border-border/70"
                        style={{ left: `${m.percent}%` }}
                      />
                    ))}
                  </div>

                  {compareSlices.map((slice) => {
                    const coords = getCoordinates(
                      slice.startTime,
                      slice.endTime,
                    );
                    if (parseFloat(coords.width) <= 0) return null;

                    // กำหนดการแสดงสีในช่อง Compare
                    let statusClasses =
                      "bg-muted border-border text-muted-foreground";
                    if (slice.status === "low") {
                      statusClasses =
                        "bg-destructive/10 border-l-4 border-destructive text-destructive font-medium";
                    } else if (slice.status === "high") {
                      statusClasses =
                        "bg-amber-100 border-l-4 border-amber-500 text-amber-900 font-medium";
                    } else if (slice.status === "normal") {
                      statusClasses =
                        "bg-emerald-100 border-l-4 border-emerald-500 text-emerald-900 font-medium";
                    }

                    const startFormatted = DateTime.fromISO(slice.startTime, {
                      zone: timezone,
                    }).toFormat("dd/MM HH:mm");
                    const endFormatted = DateTime.fromISO(slice.endTime, {
                      zone: timezone,
                    }).toFormat("dd/MM HH:mm");

                    return (
                      <div
                        key={`compare-${slice.id}`}
                        style={{ left: coords.left, width: coords.width }}
                        className={cn(
                          "absolute top-1.5 bottom-1.5 rounded flex items-center justify-center text-xs z-10 shadow-2xs truncate transition-all",
                          statusClasses,
                        )}
                        title={`ช่วงเวลา: ${startFormatted} - ${endFormatted} | มีอยู่: ${
                          slice.currentCount
                        } คน | เกณฑ์ (Min: ${slice.min ?? "-"}, Max: ${
                          slice.max ?? "-"
                        })`}
                      >
                        <span className="truncate">{slice.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* แถวที่ 3: Min / Max (ไม่แสดงสีเตือน และไม่แสดงจำนวนคนจริง) */}
              <div className="flex min-h-14 bg-muted/50 transition-colors relative border-t border-border">
                <div className="w-24 sm:w-32 md:w-40 lg:w-48 shrink-0 border-r border-border p-3 flex flex-col justify-center bg-muted z-10">
                  <span className="text-sm font-bold text-foreground">
                    Min / Max
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    อัตรากำลังที่ต้องการ
                  </span>
                </div>

                <div className="grow relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    {markers.map((m) => (
                      <div
                        key={m.id}
                        className="absolute top-0 bottom-0 border-l border-border/70"
                        style={{ left: `${m.percent}%` }}
                      />
                    ))}
                  </div>

                  {minMaxs.map((mm) => {
                    const coords = getCoordinates(mm.startTime, mm.endTime);
                    if (parseFloat(coords.width) <= 0) return null;

                    const startFormatted = DateTime.fromISO(mm.startTime, {
                      zone: timezone,
                    }).toFormat("dd/MM HH:mm");
                    const endFormatted = DateTime.fromISO(mm.endTime, {
                      zone: timezone,
                    }).toFormat("dd/MM HH:mm");

                    return (
                      <Link
                        key={mm.id}
                        href={`/work-schedule/admin/${placeId}/position/${positionId}/min-max/${mm.id}`}
                        style={{ left: coords.left, width: coords.width }}
                        className={cn(
                          "absolute top-1.5 bottom-1.5 bg-muted border border-border rounded flex flex-col justify-center text-xs text-foreground z-10",
                          "transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                          coords.isClippedLeft &&
                            "rounded-l-none border-l-0 border-dashed",
                          coords.isClippedRight &&
                            "rounded-r-none border-r-2 border-dashed",
                        )}
                        title={`เกณฑ์ช่วงเวลา: ${startFormatted} - ${endFormatted} | Min: ${
                          mm.min ?? "-"
                        }, Max: ${mm.max ?? "-"}`}
                      >
                        <div className="font-semibold truncate text-[11px]">
                          Min: {mm.min ?? 0} / Max: {mm.max ?? "∞"}
                        </div>
                        <span className="text-[10px] opacity-70 truncate">
                          {DateTime.fromISO(mm.startTime, {
                            zone: timezone,
                          }).toFormat("HH:mm")}{" "}
                          -{" "}
                          {DateTime.fromISO(mm.endTime, {
                            zone: timezone,
                          }).toFormat("HH:mm")}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
