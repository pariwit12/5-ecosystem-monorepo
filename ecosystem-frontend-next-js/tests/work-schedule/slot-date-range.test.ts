import { DateTime } from "luxon";
import {
  createSlotPeriodRange,
  formatSlotDateRange,
  parseSlotDateRange,
  shiftSlotPeriodRange,
  type SlotPeriod,
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

describe("slot calendar periods", () => {
  test.each<[SlotPeriod, string, string, string]>([
    ["month", "2026-10-24T15:30", "2026-10-01T00:00", "2026-11-01T00:00"],
    ["month", "2026-12-31T23:59", "2026-12-01T00:00", "2027-01-01T00:00"],
    ["month", "2028-02-29T12:00", "2028-02-01T00:00", "2028-03-01T00:00"],
    ["week", "2026-10-26T18:00", "2026-10-26T00:00", "2026-11-02T00:00"],
    ["week", "2026-11-01T23:59", "2026-10-26T00:00", "2026-11-02T00:00"],
    ["week", "2027-01-03T12:00", "2026-12-28T00:00", "2027-01-04T00:00"],
    ["day", "2026-10-24T15:30", "2026-10-24T00:00", "2026-10-25T00:00"],
    ["day", "2026-12-31T23:59", "2026-12-31T00:00", "2027-01-01T00:00"],
  ])(
    "creates an exclusive %s range around %s",
    (period, reference, draftStartDateTime, draftEndDateTime) => {
      const result = createSlotPeriodRange(period, "Asia/Bangkok", reference);

      expect(result).toEqual({
        ok: true,
        range: { draftStartDateTime, draftEndDateTime },
      });
      expect(
        parseSlotDateRange(
          draftStartDateTime,
          draftEndDateTime,
          "Asia/Bangkok",
        ).ok,
      ).toBe(true);
    },
  );

  test.each<[SlotPeriod, -1 | 1, string, string, string]>([
    ["month", -1, "2026-03-31T14:00", "2026-02-01T00:00", "2026-03-01T00:00"],
    ["month", 1, "2026-12-31T14:00", "2027-01-01T00:00", "2027-02-01T00:00"],
    ["week", -1, "2027-01-04T14:00", "2026-12-28T00:00", "2027-01-04T00:00"],
    ["week", 1, "2026-12-31T14:00", "2027-01-04T00:00", "2027-01-11T00:00"],
    ["day", -1, "2027-01-01T14:00", "2026-12-31T00:00", "2027-01-01T00:00"],
    ["day", 1, "2026-12-31T14:00", "2027-01-01T00:00", "2027-01-02T00:00"],
  ])(
    "shifts %s by %s from normalized reference %s",
    (period, direction, reference, draftStartDateTime, draftEndDateTime) => {
      expect(
        shiftSlotPeriodRange(period, direction, "Asia/Bangkok", reference),
      ).toEqual({
        ok: true,
        range: { draftStartDateTime, draftEndDateTime },
      });
    },
  );

  test.each<[SlotPeriod, string, string]>([
    ["month", "2027-02-01T00:00", "2027-03-01T00:00"],
    ["week", "2027-01-11T00:00", "2027-01-18T00:00"],
    ["day", "2027-01-02T00:00", "2027-01-03T00:00"],
  ])(
    "continues shifting %s from the most recent draft",
    (period, draftStartDateTime, draftEndDateTime) => {
      const first = shiftSlotPeriodRange(
        period,
        1,
        "Asia/Bangkok",
        "2026-12-31T15:00",
      );
      if (!first.ok) throw new Error("Expected a valid period range");

      expect(
        shiftSlotPeriodRange(
          period,
          1,
          "Asia/Bangkok",
          first.range.draftStartDateTime,
        ),
      ).toEqual({
        ok: true,
        range: { draftStartDateTime, draftEndDateTime },
      });
    },
  );

  test.each(["2026-12-31T22:30:00Z", DateTime.utc(2026, 12, 31, 22, 30)])(
    "converts an offset string or DateTime instant to the requested timezone (%s)",
    (reference) => {
      expect(createSlotPeriodRange("day", "Asia/Bangkok", reference)).toEqual({
        ok: true,
        range: {
          draftStartDateTime: "2027-01-01T00:00",
          draftEndDateTime: "2027-01-02T00:00",
        },
      });
      expect(
        createSlotPeriodRange("day", "America/Los_Angeles", reference),
      ).toEqual({
        ok: true,
        range: {
          draftStartDateTime: "2026-12-31T00:00",
          draftEndDateTime: "2027-01-01T00:00",
        },
      });
      expect(
        shiftSlotPeriodRange("month", -1, "Asia/Bangkok", reference),
      ).toEqual({
        ok: true,
        range: {
          draftStartDateTime: "2026-12-01T00:00",
          draftEndDateTime: "2027-01-01T00:00",
        },
      });
    },
  );

  test("uses the current instant when no reference is supplied", () => {
    const fixedNow = DateTime.utc(2026, 12, 31, 22, 30);
    if (!fixedNow.isValid) throw new Error("Expected a valid fixed instant");
    const now = jest.spyOn(DateTime, "now").mockReturnValue(fixedNow);

    try {
      expect(createSlotPeriodRange("day", "Asia/Bangkok")).toEqual({
        ok: true,
        range: {
          draftStartDateTime: "2027-01-01T00:00",
          draftEndDateTime: "2027-01-02T00:00",
        },
      });
      expect(shiftSlotPeriodRange("day", -1, "Asia/Bangkok")).toEqual({
        ok: true,
        range: {
          draftStartDateTime: "2026-12-31T00:00",
          draftEndDateTime: "2027-01-01T00:00",
        },
      });
    } finally {
      now.mockRestore();
    }
  });

  test.each<[SlotPeriod, string, string, string, number]>([
    ["day", "2026-03-08T12:00", "2026-03-08T00:00", "2026-03-09T00:00", 23],
    ["day", "2026-11-01T12:00", "2026-11-01T00:00", "2026-11-02T00:00", 25],
    ["week", "2026-03-04T12:00", "2026-03-02T00:00", "2026-03-09T00:00", 167],
    ["week", "2026-10-28T12:00", "2026-10-26T00:00", "2026-11-02T00:00", 169],
    ["month", "2026-03-14T12:00", "2026-03-01T00:00", "2026-04-01T00:00", 743],
    ["month", "2026-11-14T12:00", "2026-11-01T00:00", "2026-12-01T00:00", 721],
  ])(
    "keeps %s boundaries at local midnight across DST (%s)",
    (period, reference, draftStartDateTime, draftEndDateTime, expectedHours) => {
      const timezone = "America/New_York";
      const result = createSlotPeriodRange(period, timezone, reference);

      expect(result).toEqual({
        ok: true,
        range: { draftStartDateTime, draftEndDateTime },
      });
      const parsed = parseSlotDateRange(
        draftStartDateTime,
        draftEndDateTime,
        timezone,
      );
      if (!parsed.ok) throw new Error("Expected a valid slot date range");

      expect(
        DateTime.fromISO(parsed.range.endTime).diff(
          DateTime.fromISO(parsed.range.startTime),
          "hours",
        ).hours,
      ).toBe(expectedHours);
    },
  );

  test.each<[1 | -1, string, string, string]>([
    [1, "2026-03-07T12:00", "2026-03-08T00:00", "2026-03-09T00:00"],
    [-1, "2026-11-02T12:00", "2026-11-01T00:00", "2026-11-02T00:00"],
  ])(
    "shifts a calendar day across DST by %s from %s",
    (direction, reference, draftStartDateTime, draftEndDateTime) => {
      expect(
        shiftSlotPeriodRange("day", direction, "America/New_York", reference),
      ).toEqual({
        ok: true,
        range: { draftStartDateTime, draftEndDateTime },
      });
    },
  );

  test.each([undefined, "", "Invalid/Timezone"])(
    "rejects an invalid period timezone (%s)",
    (timezone) => {
      const expected = {
        ok: false,
        error: "วันเวลา หรือเขตเวลาไม่ถูกต้อง",
      };

      expect(
        createSlotPeriodRange("month", timezone, "2026-10-24T12:00"),
      ).toEqual(expected);
      expect(
        shiftSlotPeriodRange("day", 1, timezone, DateTime.utc(2026, 10, 24)),
      ).toEqual(expected);
    },
  );

  test.each(["", "not-a-date", "2026-02-30T12:00", DateTime.invalid("test")])(
    "rejects an invalid period reference (%s)",
    (reference) => {
      const expected = {
        ok: false,
        error: "วันเวลา หรือเขตเวลาไม่ถูกต้อง",
      };

      expect(
        createSlotPeriodRange("week", "Asia/Bangkok", reference),
      ).toEqual(expected);
      expect(
        shiftSlotPeriodRange("week", -1, "Asia/Bangkok", reference),
      ).toEqual(expected);
    },
  );
});
