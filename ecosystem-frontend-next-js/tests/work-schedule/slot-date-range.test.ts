import {
  formatSlotDateRange,
  parseSlotDateRange,
} from "@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/slot-date-range";

describe("slot date range", () => {
  test.each([
    {
      timezone: "Asia/Bangkok",
      expectedStartTime: "2026-10-24T01:00:00.000Z",
      expectedEndTime: "2026-10-24T10:00:00.000Z",
    },
    {
      timezone: "UTC",
      expectedStartTime: "2026-10-24T08:00:00.000Z",
      expectedEndTime: "2026-10-24T17:00:00.000Z",
    },
  ])(
    "converts $timezone input to UTC and formats it in the saved timezone",
    ({ timezone, expectedStartTime, expectedEndTime }) => {
      const result = parseSlotDateRange(
        "2026-10-24T08:00",
        "2026-10-24T17:00",
        timezone,
      );

      expect(result).toEqual({
        ok: true,
        range: {
          draftStartDateTime: "2026-10-24T08:00",
          draftEndDateTime: "2026-10-24T17:00",
          startTime: expectedStartTime,
          endTime: expectedEndTime,
          timezone,
        },
      });
      if (!result.ok) throw new Error("Expected a valid slot date range");

      expect(formatSlotDateRange(result.range)).toBe(
        `24/10/2026 08:00 – 24/10/2026 17:00 (${timezone})`,
      );
    },
  );

  test("formats the applied UTC bounds without reading the raw draft values", () => {
    expect(
      formatSlotDateRange({
        draftStartDateTime: "2026-10-25T09:00",
        draftEndDateTime: "2026-10-25T18:00",
        startTime: "2026-10-24T18:30:00.000Z",
        endTime: "2026-10-25T01:45:00.000Z",
        timezone: "Asia/Bangkok",
      }),
    ).toBe("25/10/2026 01:30 – 25/10/2026 08:45 (Asia/Bangkok)");
  });

  test.each([
    ["", ""],
    ["", "2026-10-24T17:00"],
    ["2026-10-24T08:00", ""],
  ])("rejects missing input (%s, %s)", (start, end) => {
    expect(parseSlotDateRange(start, end, "Asia/Bangkok")).toEqual({
      ok: false,
      error: "กรุณาระบุวันและเวลาเริ่มต้นและสิ้นสุด",
    });
  });

  test.each([
    ["not-a-date", "2026-10-24T17:00"],
    ["2026-10-24T08:00", "not-a-date"],
    ["2026-02-30T08:00", "2026-10-24T17:00"],
    ["2026-10-24T08:00", "2026-10-24T25:00"],
  ])("rejects malformed datetime input (%s, %s)", (start, end) => {
    expect(parseSlotDateRange(start, end, "Asia/Bangkok")).toEqual({
      ok: false,
      error: "วันเวลา หรือเขตเวลาไม่ถูกต้อง",
    });
  });

  test.each([undefined, "", "Invalid/Timezone"])(
    "rejects a missing or invalid timezone (%s)",
    (timezone) => {
      expect(
        parseSlotDateRange("2026-10-24T08:00", "2026-10-24T17:00", timezone),
      ).toEqual({
        ok: false,
        error: "วันเวลา หรือเขตเวลาไม่ถูกต้อง",
      });
    },
  );

  test.each(["2026-10-24T08:00", "2026-10-24T07:59"])(
    "rejects an end that is not after the start (%s)",
    (end) => {
      expect(
        parseSlotDateRange("2026-10-24T08:00", end, "Asia/Bangkok"),
      ).toEqual({
        ok: false,
        error: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น",
      });
    },
  );
});
