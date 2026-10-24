import { fireEvent, render, screen } from "@testing-library/react";
import { WorkScheduleBoard } from "@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board";

describe("admin work schedule board holidays", () => {
  const startDateTime = "2026-10-24T08:00:00.000Z";
  const endDateTime = "2026-10-24T12:00:00.000Z";

  function renderBoard() {
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
      />,
    );
  }

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
