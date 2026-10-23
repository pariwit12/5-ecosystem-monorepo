'use client';

import { useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { workScheduleSlotQueries } from '../work-schedule-slot.queries';

interface MyWorkScheduleCalendarProps {
  placeId: string;
  placeTimezone: string;
}

export function MyWorkScheduleCalendar({
  placeId,
  placeTimezone,
}: MyWorkScheduleCalendarProps) {
  const { getToken, userId } = useAuth();
  const [month, setMonth] = useState(() =>
    DateTime.now().setZone(placeTimezone).startOf('month'),
  );
  const { startTime, endTime } = useMemo(() => {
    const startTime = month.toUTC().toISO();
    const endTime = month.plus({ months: 1 }).toUTC().toISO();
    return { startTime: startTime ?? '', endTime: endTime ?? '' };
  }, [month]);
  const { data, isLoading, error } = useQuery(
    workScheduleSlotQueries.mySlotsByPlaceIdStartTimeEndTime(
      placeId,
      startTime,
      endTime,
      userId,
      getToken,
    ),
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-800">ตารางเวรของคุณ</h2>
          <p className="mt-1 text-xs text-gray-500">เวลาอิงตาม {placeTimezone}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMonth((value) => value.minus({ months: 1 }))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            เดือนก่อนหน้า
          </button>
          <span className="min-w-28 text-center text-sm font-semibold text-gray-800">
            {month.setLocale('th').toFormat('LLLL yyyy')}
          </span>
          <button type="button" onClick={() => setMonth((value) => value.plus({ months: 1 }))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            เดือนถัดไป
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 py-6 text-center text-sm text-gray-400">กำลังโหลดตารางเวร...</div>
      ) : error ? (
        <div className="mt-4 py-6 text-center text-sm text-red-500">ไม่สามารถโหลดตารางเวรได้</div>
      ) : !data?.workScheduleSlots.length ? (
        <div className="mt-4 rounded-xl border border-dashed py-8 text-center text-sm text-gray-400">ไม่มีเวรในเดือนนี้</div>
      ) : (
        <div className="mt-4 divide-y divide-gray-100">
          {data.workScheduleSlots.map((slot) => {
            const start = DateTime.fromISO(slot.actualStartTime).setZone(placeTimezone);
            const end = DateTime.fromISO(slot.actualEndTime).setZone(placeTimezone);
            return (
              <div key={slot.id} className="py-3">
                <p className="text-sm font-semibold text-gray-800">{start.setLocale('th').toFormat('dd LLLL yyyy')}</p>
                <p className="mt-1 text-sm text-gray-600">{start.toFormat('HH:mm')} - {end.toFormat('HH:mm')} · {slot.slotTypeName}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
