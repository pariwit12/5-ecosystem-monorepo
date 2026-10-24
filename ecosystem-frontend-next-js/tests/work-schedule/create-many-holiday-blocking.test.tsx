import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreateManyForm } from "@/features/work-schedule/slot/components/create-many-form";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

const mockPreflight = jest.fn();
const mockMutate = jest.fn();
const mockRouterPush = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ userId: "admin-1", getToken: async () => "token" }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect }: { onSelect: (dates: Date[]) => void }) => (
    <button type="button" onClick={() => onSelect([new Date(2026, 9, 24, 12)])}>
      เลือกวันทดสอบ
    </button>
  ),
}));

jest.mock("@/features/work-schedule/slot/hooks/use-create-many", () => ({
  useCreateMany: () => ({ mutate: mockMutate, isPending: false }),
}));

jest.mock("@/features/work-schedule/slot/work-schedule-slot.queries", () => ({
  workScheduleSlotQueries: {
    queryGetSlotsByPositionIdStartTimeEndTime: (
      positionId: string,
      startTime: string,
      endTime: string,
    ) => ({
      queryKey: ["holiday-preflight", positionId, startTime, endTime],
      queryFn: () => mockPreflight(),
    }),
  },
}));

const STAFF_ONE = "018f6c5e-8557-7888-8123-456789000001";
const STAFF_TWO = "018f6c5e-8557-7888-8123-456789000002";
const SLOT_TYPE = "018f6c5e-8557-7888-8123-456789000003";
const POSITION = "018f6c5e-8557-7888-8123-456789000004";

function newQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
}

function renderForm(queryClient = newQueryClient()) {
  const view = render(
    <QueryClientProvider client={queryClient}>
      <CreateManyForm
        positionId={POSITION}
        staffPositions={[
          { staffId: STAFF_ONE, name: "Staff One" },
          { staffId: STAFF_TWO, name: "Staff Two" },
        ]}
        placeTimezone="Asia/Bangkok"
        availableSlotTypes={[{ id: SLOT_TYPE, name: "Day" }]}
        urlOnSuccess="/done"
        urlOnCancel="/cancel"
      />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

function fillForm(selectStaff = true) {
  fireEvent.click(screen.getByRole("button", { name: "เลือกวันทดสอบ" }));
  fireEvent.change(screen.getByLabelText("ชนิด/ประเภทกะการทำงาน *"), {
    target: { value: SLOT_TYPE },
  });
  fireEvent.change(screen.getByLabelText("เวลาเริ่มงาน *"), {
    target: { value: "08:00" },
  });
  fireEvent.change(screen.getByLabelText("ระยะเวลา (นาที) *"), {
    target: { value: "120" },
  });
  if (selectStaff) {
    fireEvent.click(screen.getAllByRole("checkbox")[1]);
  }
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูล" }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockMutate.mockReset();
  mockPreflight.mockReset();
});

describe("CreateManyForm holiday preflight", () => {
  it("requires a selected staff member before preflight or mutation", async () => {
    renderForm();
    fillForm(false);
    submit();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "กรุณาเลือกพนักงาน",
    );
    expect(mockPreflight).not.toHaveBeenCalled();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("blocks a selected staff member whose candidate slot overlaps a holiday", async () => {
    mockPreflight.mockResolvedValue({
      workScheduleHolidays: [
        {
          id: "holiday-1",
          staffId: STAFF_ONE,
          startTime: "2026-10-24T02:00:00.000Z",
          endTime: "2026-10-24T04:00:00.000Z",
        },
      ],
    });
    renderForm();
    fillForm();
    submit();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Staff One",
    );
    expect(screen.getByRole("alert").textContent).toContain("วันหยุด");
    expect(mockPreflight).toHaveBeenCalledTimes(1);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("ignores a holiday belonging to a staff member that was not selected", async () => {
    mockPreflight.mockResolvedValue({
      workScheduleHolidays: [
        {
          id: "holiday-2",
          staffId: STAFF_TWO,
          startTime: "2026-10-24T01:00:00.000Z",
          endTime: "2026-10-24T05:00:00.000Z",
        },
      ],
    });
    renderForm();
    fillForm();
    submit();

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    expect(mockMutate.mock.calls[0][0].slots).toHaveLength(1);
  });

  it("submits when the selected employee's holiday does not overlap", async () => {
    mockPreflight.mockResolvedValue({
      workScheduleHolidays: [
        {
          id: "holiday-1",
          staffId: STAFF_ONE,
          startTime: "2026-10-24T03:00:00.000Z",
          endTime: "2026-10-24T04:00:00.000Z",
        },
      ],
    });
    renderForm();
    fillForm();
    submit();

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
  });

  it("stops submission and asks the admin to retry when preflight fails", async () => {
    mockPreflight.mockRejectedValue(new Error("Request failed"));
    renderForm();
    fillForm();
    submit();

    expect((await screen.findByRole("alert")).textContent).toContain(
      "ตรวจสอบวันหยุดไม่สำเร็จ",
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("does not show a duplicate generic toast for a backend holiday conflict", async () => {
    mockPreflight.mockResolvedValue({ workScheduleHolidays: [] });
    renderForm();
    fillForm();
    submit();

    await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
    const options = mockMutate.mock.calls[0][1] as {
      onError: (error: unknown) => void;
    };
    options.onError({
      response: {
        data: { errorCode: ErrorCode.WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP },
      },
    });

    expect(toast.error).not.toHaveBeenCalled();
  });
});
