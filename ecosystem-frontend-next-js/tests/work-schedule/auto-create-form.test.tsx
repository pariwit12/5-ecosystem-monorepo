import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toast } from "sonner";
import { AutoCreateForm } from "@/features/work-schedule/slot/components/auto-create-form";

const mockMutate = jest.fn();
const mockRouterPush = jest.fn();
let mockIsPending = false;
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("@/features/work-schedule/slot/hooks/use-auto-create", () => ({
  useAutoCreate: () => ({ mutate: mockMutate, isPending: mockIsPending }),
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
function selectStrategy(name = "กระจายจำนวนเวรรวมให้ใกล้เคียงกัน") {
  fireEvent.click(screen.getByRole("radio", { name }));
}
function submit() {
  fireEvent.click(screen.getByRole("button", { name: "จัดเวรอัตโนมัติ" }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockIsPending = false;
});

describe("AutoCreateForm", () => {
  it("defaults to MINIMUM and allows selecting MAXIMUM", () => {
    renderForm();
    const minimum = screen.getByRole<HTMLInputElement>("radio", {
      name: "ให้ถึงจำนวนขั้นต่ำ (Min)",
    });
    const maximum = screen.getByRole<HTMLInputElement>("radio", {
      name: "จัดให้มากที่สุดภายใต้จำนวนสูงสุด (Max)",
    });
    expect(minimum.checked).toBe(true);
    expect(maximum.checked).toBe(false);
    fireEvent.click(maximum);
    expect(minimum.checked).toBe(false);
    expect(maximum.checked).toBe(true);
  });

  it("shows two assignment strategies in a separate group with no default", () => {
    renderForm();
    expect(
      screen.getByRole("group", { name: "เป้าหมายการจัดเวร" }),
    ).toBeTruthy();
    expect(screen.getByRole("group", { name: "วิธีจัดพนักงาน" })).toBeTruthy();
    for (const name of [
      "เพิ่มเวลาพักระหว่างเวรให้มากที่สุด",
      "กระจายจำนวนเวรรวมให้ใกล้เคียงกัน",
    ]) {
      expect(
        screen.getByRole<HTMLInputElement>("radio", { name }).checked,
      ).toBe(false);
    }
  });

  it("requires an explicit assignment strategy before mutation", async () => {
    renderForm();
    fillDates();
    selectAll();
    submit();
    expect(await screen.findByText("กรุณาเลือกวิธีจัดพนักงาน")).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it.each([
    [
      "MINIMUM",
      "ให้ถึงจำนวนขั้นต่ำ (Min)",
      "MAXIMIZE_REST",
      "เพิ่มเวลาพักระหว่างเวรให้มากที่สุด",
    ],
    [
      "MINIMUM",
      "ให้ถึงจำนวนขั้นต่ำ (Min)",
      "BALANCE_TOTAL",
      "กระจายจำนวนเวรรวมให้ใกล้เคียงกัน",
    ],
    [
      "MAXIMUM",
      "จัดให้มากที่สุดภายใต้จำนวนสูงสุด (Max)",
      "MAXIMIZE_REST",
      "เพิ่มเวลาพักระหว่างเวรให้มากที่สุด",
    ],
    [
      "MAXIMUM",
      "จัดให้มากที่สุดภายใต้จำนวนสูงสุด (Max)",
      "BALANCE_TOTAL",
      "กระจายจำนวนเวรรวมให้ใกล้เคียงกัน",
    ],
  ] as const)(
    "submits target %s (%s) independently of assignment %s",
    async (targetMode, targetLabel, assignmentMode, assignmentLabel) => {
      renderForm();
      fillDates();
      selectAll();
      fireEvent.click(screen.getByRole("radio", { name: targetLabel }));
      selectStrategy(assignmentLabel);
      submit();
      await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
      expect(mockMutate.mock.calls[0][0]).toMatchObject({
        targetMode,
        assignmentMode,
      });
    },
  );

  it("requires selections when there is one template and one staff member", async () => {
    renderSingleOptionForm();
    fillDates();
    selectStrategy();
    submit();
    expect(
      await screen.findByText("กรุณาเลือกแบบร่างอย่างน้อย 1 รายการ"),
    ).toBeTruthy();
    expect(screen.getByText("กรุณาเลือกพนักงานอย่างน้อย 1 คน")).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("submits arrays when there is one selected template and one selected staff member", async () => {
    renderSingleOptionForm();
    fillDates();
    fireEvent.click(screen.getByRole("checkbox", { name: "Morning" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Staff One" }));
    selectStrategy();
    submit();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0]).toEqual({
      positionId: POSITION,
      targetMode: "MINIMUM",
      assignmentMode: "BALANCE_TOTAL",
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
    selectStrategy();
    submit();
    expect(await screen.findByText("กรุณาระบุเวลาเริ่มต้น")).toBeTruthy();
    expect(screen.getByText("กรุณาระบุเวลาสิ้นสุด")).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("requires at least one template", async () => {
    renderForm();
    fillDates();
    fireEvent.click(screen.getByRole("checkbox", { name: "Staff One" }));
    selectStrategy();
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
    selectStrategy();
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
      selectStrategy();
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
    selectStrategy();
    submit();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0]).toEqual({
      positionId: POSITION,
      targetMode: "MINIMUM",
      assignmentMode: "BALANCE_TOTAL",
      startTime: "2026-10-28T08:00:00.000+07:00",
      endTime: "2026-10-28T18:00:00.000+07:00",
      slotTemplateIds: [TEMPLATE_ONE, TEMPLATE_TWO],
      staffIds: [STAFF_ONE, STAFF_TWO],
      skipErrorCodes: undefined,
    });
  });

  it("submits the selected MAXIMUM mode with Place timezone times", async () => {
    renderForm();
    fillDates();
    selectAll();
    fireEvent.click(
      screen.getByRole("radio", {
        name: "จัดให้มากที่สุดภายใต้จำนวนสูงสุด (Max)",
      }),
    );
    selectStrategy();
    submit();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0]).toEqual({
      positionId: POSITION,
      targetMode: "MAXIMUM",
      assignmentMode: "BALANCE_TOTAL",
      startTime: "2026-10-28T08:00:00.000+07:00",
      endTime: "2026-10-28T18:00:00.000+07:00",
      slotTemplateIds: [TEMPLATE_ONE, TEMPLATE_TWO],
      staffIds: [STAFF_ONE, STAFF_TWO],
      skipErrorCodes: undefined,
    });
  });

  it("disables the mode fieldset and prevents mutation while pending", async () => {
    const { container, rerender } = renderForm();
    fillDates();
    selectAll();
    selectStrategy();
    mockIsPending = true;
    rerender(
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
        placeTimezone="Asia/Bangkok"
        urlOnSuccess="/slots"
        urlOnCancel="/menu"
      />,
    );
    const fieldset = screen.getByRole<HTMLFieldSetElement>("group", {
      name: "เป้าหมายการจัดเวร",
    });
    expect(fieldset.disabled).toBe(true);
    expect(
      screen.getByRole<HTMLFieldSetElement>("group", {
        name: "วิธีจัดพนักงาน",
      }).disabled,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLButtonElement>("button", {
        name: "กำลังจัดเวร...",
      }).disabled,
    ).toBe(true);
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    await act(async () => {
      fireEvent.submit(form!);
    });
    expect(mockMutate).not.toHaveBeenCalled();
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
      selectStrategy();
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
      selectStrategy();
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
    selectStrategy();
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
      selectStrategy();
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
    selectStrategy();
    submit();
    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    mockMutate.mock.calls[0][1].onError(new Error("Request failed"));
    expect(toast.error).toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
