import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { WorkScheduleBoard } from "@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board";

type BoardProps = ComponentProps<typeof WorkScheduleBoard>;

describe("admin work schedule board holidays", () => {
  const startDateTime = "2026-10-24T08:00:00.000Z";
  const endDateTime = "2026-10-24T12:00:00.000Z";

  function renderBoard(overrides: Partial<BoardProps> = {}) {
    return render(
      <WorkScheduleBoard
        slots={[
          {
            id: "slot-day",
            staffId: "staff-1",
            staffName: "Staff One",
            slotTypeId: "day",
            slotTypeName: "Day",
            actualStartTime: "2026-10-24T08:00:00.000Z",
            actualEndTime: "2026-10-24T10:00:00.000Z",
          },
          {
            id: "slot-night",
            staffId: "staff-2",
            staffName: "Staff Two",
            slotTypeId: "night",
            slotTypeName: "Night",
            actualStartTime: "2026-10-24T10:00:00.000Z",
            actualEndTime: "2026-10-24T12:00:00.000Z",
          },
        ]}
        minMaxs={[
          {
            id: "min-max",
            min: 2,
            max: 3,
            startTime: startDateTime,
            endTime: endDateTime,
          },
        ]}
        workScheduleHolidays={[
          {
            id: "holiday-1",
            staffId: "staff-1",
            startTime: "2026-10-24T07:00:00.000Z",
            endTime: "2026-10-24T10:00:00.000Z",
          },
        ]}
        staffPositions={[
          { staffId: "staff-1", name: "Staff One" },
          { staffId: "staff-2", name: "Staff Two" },
        ]}
        startDateTime={startDateTime}
        endDateTime={endDateTime}
        placeId="place-1"
        positionId="position-1"
        timezone="UTC"
        {...overrides}
      />,
    );
  }

  function staffCell(name: string) {
    return within(screen.getByText(name).parentElement!);
  }

  function slot(overrides: Partial<BoardProps["slots"][number]>) {
    return {
      id: "slot-day",
      staffId: "staff-1",
      staffName: "Staff One",
      slotTypeId: "day",
      slotTypeName: "Day",
      actualStartTime: startDateTime,
      actualEndTime: endDateTime,
      ...overrides,
    };
  }

  it("links the displayed min/max to its management page", () => {
    renderBoard();

    const minMax = screen.getByTitle("เกณฑ์ช่วงเวลา: 24/10 08:00 - 24/10 12:00 | Min: 2, Max: 3");
    expect(minMax.tagName).toBe("A");
    expect(minMax.getAttribute("href"))
      .toBe("/work-schedule/admin/place-1/position/position-1/min-max/min-max");
    expect(minMax.style.left).toBe("0%");
    expect(minMax.style.width).toBe("100%");
    expect(minMax.textContent).toContain("Min: 2 / Max: 3");
  });

  it("renders a clipped holiday on the matching staff row without including it in staffing counts", () => {
    renderBoard();

    const holiday = screen.getByRole("note", {
      name: "วันหยุดของ Staff One 24/10 07:00 ถึง 24/10 10:00",
    });
    expect(holiday.textContent).toContain("วันหยุด");
    expect((holiday as HTMLElement).style.left).toBe("0%");
    expect((holiday as HTMLElement).style.width).toBe("50%");
    expect(screen.getAllByText("1 คน")).toHaveLength(2);
    expect(screen.getAllByText("ขาด 1 คน")).toHaveLength(2);
    expect(staffCell("Staff One").getByText("เวร: 1 เวร · ทำงาน: 2 ชม. 0 นาที")).toBeTruthy();
    expect(staffCell("Staff One").getByText("หยุด: 2 ชม. 0 นาที")).toBeTruthy();
  });

  it("keeps holidays visible when the slot type filter changes", () => {
    renderBoard();
    fireEvent.change(screen.getByLabelText("กะการทำงาน:"), {
      target: { value: "night" },
    });

    expect(
      screen.getByRole("note", {
        name: "วันหยุดของ Staff One 24/10 07:00 ถึง 24/10 10:00",
      }),
    ).toBeTruthy();
    expect(screen.getAllByText("1 คน")).toHaveLength(1);
    expect(screen.queryByRole("link", { name: /Day/ })).toBeNull();
    expect(staffCell("Staff One").getByText("เวร: 0 เวร · ทำงาน: 0 ชม. 0 นาที")).toBeTruthy();
    expect(staffCell("Staff One").getByText("หยุด: 2 ชม. 0 นาที")).toBeTruthy();
    expect(staffCell("Staff Two").getByText("เวร: 1 เวร · ทำงาน: 2 ชม. 0 นาที")).toBeTruthy();
    expect(staffCell("Staff Two").getByText("หยุด: 0 ชม. 0 นาที")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("กะการทำงาน:"), {
      target: { value: "all" },
    });

    expect(staffCell("Staff One").getByText("เวร: 1 เวร · ทำงาน: 2 ชม. 0 นาที")).toBeTruthy();
    expect(staffCell("Staff One").getByText("หยุด: 2 ชม. 0 นาที")).toBeTruthy();
    expect(staffCell("Staff Two").getByText("เวร: 1 เวร · ทำงาน: 2 ชม. 0 นาที")).toBeTruthy();
    expect(screen.getAllByText("1 คน")).toHaveLength(2);
    expect(screen.getAllByText("ขาด 1 คน")).toHaveLength(2);
  });

  it.each([
    ["start", "2026-10-24T07:00:00.000Z", "2026-10-24T10:00:00.000Z", "2 ชม. 0 นาที"],
    ["end", "2026-10-24T10:00:00.000Z", "2026-10-24T13:00:00.000Z", "2 ชม. 0 นาที"],
    ["both ends", "2026-10-24T07:00:00.000Z", "2026-10-24T13:00:00.000Z", "4 ชม. 0 นาที"],
  ])("counts only the overlapping work duration for a slot crossing the board %s", (_boundary, actualStartTime, actualEndTime, duration) => {
    renderBoard({ slots: [slot({ actualStartTime, actualEndTime })] });

    expect(staffCell("Staff One").getByText(`เวร: 1 เวร · ทำงาน: ${duration}`)).toBeTruthy();
  });

  it("unions overlapping holidays without changing staffing counts", () => {
    renderBoard({
      workScheduleHolidays: [
        {
          id: "holiday-2",
          staffId: "staff-1",
          startTime: "2026-10-24T09:00:00.000Z",
          endTime: "2026-10-24T11:00:00.000Z",
        },
        {
          id: "holiday-1",
          staffId: "staff-1",
          startTime: "2026-10-24T07:00:00.000Z",
          endTime: "2026-10-24T10:00:00.000Z",
        },
        {
          id: "holiday-nested",
          staffId: "staff-1",
          startTime: "2026-10-24T09:30:00.000Z",
          endTime: "2026-10-24T10:30:00.000Z",
        },
      ],
    });

    expect(staffCell("Staff One").getByText("หยุด: 3 ชม. 0 นาที")).toBeTruthy();
    expect(screen.getAllByRole("note")).toHaveLength(3);
    expect(screen.getAllByText("1 คน")).toHaveLength(2);
    expect(screen.getAllByText("ขาด 1 คน")).toHaveLength(2);
  });

  it("excludes intervals that only touch the board boundaries or have zero duration", () => {
    const intervals = [
      ["2026-10-24T07:00:00.000Z", startDateTime],
      [endDateTime, "2026-10-24T13:00:00.000Z"],
      ["2026-10-24T09:00:00.000Z", "2026-10-24T09:00:00.000Z"],
    ];
    renderBoard({
      slots: intervals.map(([actualStartTime, actualEndTime], index) =>
        slot({ id: `slot-${index}`, actualStartTime, actualEndTime }),
      ),
      workScheduleHolidays: intervals.map(([startTime, endTime], index) => ({
        id: `holiday-${index}`,
        staffId: "staff-1",
        startTime,
        endTime,
      })),
    });

    expect(staffCell("Staff One").getByText("เวร: 0 เวร · ทำงาน: 0 ชม. 0 นาที")).toBeTruthy();
    expect(staffCell("Staff One").getByText("หยุด: 0 ชม. 0 นาที")).toBeTruthy();
  });

  it("shows explicit zero summaries for staff without slots or holidays", () => {
    renderBoard({
      staffPositions: [
        { staffId: "staff-1", name: "Staff One" },
        { staffId: "staff-2", name: "Staff Two" },
        { staffId: "staff-3", name: "Staff Three" },
      ],
    });

    expect(staffCell("Staff Three").getByText("เวร: 0 เวร · ทำงาน: 0 ชม. 0 นาที")).toBeTruthy();
    expect(staffCell("Staff Three").getByText("หยุด: 0 ชม. 0 นาที")).toBeTruthy();
  });

  it("sums durations before flooring to minutes and keeps hours above 24", () => {
    renderBoard({
      endDateTime: "2026-10-26T08:00:00.000Z",
      slots: [
        slot({ actualEndTime: "2026-10-25T11:30:40.000Z" }),
        slot({
          id: "slot-short",
          actualStartTime: "2026-10-25T12:00:00.000Z",
          actualEndTime: "2026-10-25T12:00:30.000Z",
        }),
      ],
      workScheduleHolidays: [{
        id: "holiday-long",
        staffId: "staff-2",
        startTime: startDateTime,
        endTime: "2026-10-25T11:30:59.000Z",
      }],
    });

    expect(staffCell("Staff One").getByText("เวร: 2 เวร · ทำงาน: 27 ชม. 31 นาที")).toBeTruthy();
    expect(staffCell("Staff Two").getByText("หยุด: 27 ชม. 30 นาที")).toBeTruthy();
  });

  it("does not show an employee summary for the unassigned row", () => {
    renderBoard({ slots: [slot({ staffId: "", staffName: "" })] });

    const unassignedCell = staffCell("ยังไม่ระบุพนักงาน");
    expect(unassignedCell.queryByText(/เวร:/)).toBeNull();
    expect(unassignedCell.queryByText(/ทำงาน:/)).toBeNull();
    expect(unassignedCell.queryByText(/หยุด:/)).toBeNull();
    expect(screen.getByRole("link", { name: /Day/ }).getAttribute("href"))
      .toBe("/work-schedule/admin/place-1/position/position-1/slot/slot-day");
  });

  it("keeps horizontal scrolling inside the schedule board on narrow screens", () => {
    renderBoard();

    const boardRegion = screen.getByRole("region", {
      name: "กระดานตารางเวลา เลื่อนแนวนอนเพื่อดูข้อมูลเพิ่มเติม",
    });
    expect(boardRegion.className).toContain("overflow-x-auto");
    expect(boardRegion.firstElementChild?.className).toContain("min-w-[720px]");
  });
});
