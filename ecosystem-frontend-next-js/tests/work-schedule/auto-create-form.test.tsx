import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { AutoCreateForm } from "@/features/work-schedule/slot/components/auto-create-form";

const mockMutate = jest.fn();
const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("@/features/work-schedule/slot/hooks/use-auto-create", () => ({
  useAutoCreate: () => ({ mutate: mockMutate, isPending: false }),
}));

const POSITION = "019a01b0-0000-7000-8000-000000000001";
const TEMPLATE_ONE = "019a01b0-0000-7000-8000-000000000002";
const TEMPLATE_TWO = "019a01b0-0000-7000-8000-000000000003";
const STAFF_ONE = "019a01b0-0000-7000-8000-000000000004";
const STAFF_TWO = "019a01b0-0000-7000-8000-000000000005";

function renderForm(timezone = "Asia/Bangkok") {
  return render(
    <AutoCreateForm
      positionId={POSITION}
      slotTemplates={[
        { id: TEMPLATE_ONE, name: "Morning" },
        { id: TEMPLATE_TWO, name: "Evening" },
      ]}
      staffPositions={[
        { staffId: STAFF_ONE, name: "Staff One" },
        { staffId: STAFF_TWO, name: "Staff Two" },
      ]}
      placeTimezone={timezone}
      urlOnSuccess="/slots"
      urlOnCancel="/menu"
    />,
  );
}

function renderSingleOptionForm() {
  return render(
    <AutoCreateForm
      positionId={POSITION}
      slotTemplates={[{ id: TEMPLATE_ONE, name: "Morning" }]}
      staffPositions={[{ staffId: STAFF_ONE, name: "Staff One" }]}
      placeTimezone="Asia/Bangkok"
      urlOnSuccess="/slots"
      urlOnCancel="/menu"
    />,
  );
}

function fillDates(start = "2026-10-28T08:00", end = "2026-10-28T18:00") {
  fireEvent.change(screen.getByLabelText("เวลาเริ่มต้น"), {
    target: { value: start },
  });
  fireEvent.change(screen.getByLabelText("เวลาสิ้นสุด"), {
    target: { value: end },
  });
}
function selectAll() {
  for (const label of ["Morning", "Evening", "Staff One", "Staff Two"]) {
    fireEvent.click(screen.getByRole("checkbox", { name: label }));
  }
}
function submit() {
  fireEvent.click(screen.getByRole("button", { name: "จัดเวรอัตโนมัติ" }));
}

beforeEach(() => jest.clearAllMocks());

describe("AutoCreateForm", () => {
  it("requires selections when there is one template and one staff member", async () => {
    renderSingleOptionForm();
    fillDates();
    submit();
    expect(
      await screen.findByText("กรุณาเลือกแบบร่างอย่างน้อย 1 รายการ"),
    ).toBeTruthy();
    expect(
      screen.getByText("กรุณาเลือกพนักงานอย่างน้อย 1 คน"),
    ).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("submits arrays when there is one selected template and one selected staff member", async () => {
    renderSingleOptionForm();
    fillDates();
    fireEvent.click(screen.getByRole("checkbox", { name: "Morning" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Staff One" }));
    submit();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0]).toEqual({
      positionId: POSITION,
      startTime: "2026-10-28T08:00:00.000+07:00",
      endTime: "2026-10-28T18:00:00.000+07:00",
      slotTemplateIds: [TEMPLATE_ONE],
      staffIds: [STAFF_ONE],
      skipErrorCodes: undefined,
    });
  });

  it("requires start and end wall times", async () => {
    renderForm();
    selectAll();
    submit();
    expect(await screen.findByText("กรุณาระบุเวลาเริ่มต้น")).toBeTruthy();
    expect(screen.getByText("กรุณาระบุเวลาสิ้นสุด")).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("requires at least one template", async () => {
    renderForm();
    fillDates();
    fireEvent.click(screen.getByRole("checkbox", { name: "Staff One" }));
    submit();
    expect(
      await screen.findByText("กรุณาเลือกแบบร่างอย่างน้อย 1 รายการ"),
    ).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("requires at least one staff member", async () => {
    renderForm();
    fillDates();
    fireEvent.click(screen.getByRole("checkbox", { name: "Morning" }));
    submit();
    expect(
      await screen.findByText("กรุณาเลือกพนักงานอย่างน้อย 1 คน"),
    ).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it.each(["2026-10-28T08:00", "2026-10-28T07:00"])(
    "blocks an end at or before the start (%s)",
    async (end) => {
      renderForm();
      fillDates("2026-10-28T08:00", end);
      selectAll();
      submit();
      expect(
        await screen.findByText("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น"),
      ).toBeTruthy();
      expect(mockMutate).not.toHaveBeenCalled();
    },
  );

  it("sends Place timezone offsets and every selected ID without allocating slots", async () => {
    renderForm();
    fillDates();
    selectAll();
    submit();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0]).toEqual({
      positionId: POSITION,
      startTime: "2026-10-28T08:00:00.000+07:00",
      endTime: "2026-10-28T18:00:00.000+07:00",
      slotTemplateIds: [TEMPLATE_ONE, TEMPLATE_TWO],
      staffIds: [STAFF_ONE, STAFF_TWO],
      skipErrorCodes: undefined,
    });
  });

  it.each(["start", "end"])(
    "blocks a nonexistent DST %s before mutation",
    async (field) => {
      renderForm("America/New_York");
      fillDates(
        field === "start" ? "2026-03-08T02:30" : "2026-03-08T00:00",
        field === "end" ? "2026-03-08T02:30" : "2026-03-08T05:00",
      );
      selectAll();
      submit();
      expect(
        await screen.findByText(
          "วันที่หรือเวลานี้ไม่มีอยู่จริงในเขตเวลาของสถานที่",
        ),
      ).toBeTruthy();
      expect(mockMutate).not.toHaveBeenCalled();
    },
  );

  it.each(["start", "end"])(
    "blocks an ambiguous DST %s before mutation",
    async (field) => {
      renderForm("America/New_York");
      fillDates(
        field === "start" ? "2026-11-01T01:30" : "2026-11-01T00:00",
        field === "end" ? "2026-11-01T01:30" : "2026-11-01T05:00",
      );
      selectAll();
      submit();
      expect(
        await screen.findByText(
          "เวลานี้เกิดซ้ำในเขตเวลาของสถานที่ กรุณาเลือกเวลาอื่น",
        ),
      ).toBeTruthy();
      expect(mockMutate).not.toHaveBeenCalled();
    },
  );

  it("blocks invalid Place timezone", async () => {
    renderForm("Invalid/Timezone");
    fillDates();
    selectAll();
    submit();
    expect(
      await screen.findAllByText(
        "เขตเวลาของสถานที่ไม่ถูกต้อง กรุณาตรวจสอบข้อมูลสถานที่",
      ),
    ).toHaveLength(2);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it.each([
    [4, "สร้างตารางเวร 4 รายการเรียบร้อยแล้ว"],
    [0, "ไม่มีตารางเวรที่ต้องเพิ่ม"],
  ])(
    "shows feedback for createdCount=%s and navigates to slots",
    async (createdCount, message) => {
      renderForm();
      fillDates();
      selectAll();
      submit();
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
      mockMutate.mock.calls[0][1].onSuccess({ createdCount });
      expect(toast.success).toHaveBeenCalledWith(message);
      expect(mockRouterPush).toHaveBeenCalledWith("/slots");
    },
  );

  it("keeps the form open and shows feedback on mutation failure", async () => {
    renderForm();
    fillDates();
    selectAll();
    submit();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    mockMutate.mock.calls[0][1].onError(new Error("Request failed"));
    expect(toast.error).toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
