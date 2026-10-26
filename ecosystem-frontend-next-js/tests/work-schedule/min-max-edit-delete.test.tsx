import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { EditForm } from "@/features/work-schedule/min-max/components/edit-form";
import MinMaxDetailClient from "@/app/work-schedule/admin/[placeId]/position/[positionId]/min-max/[minMaxId]/client-page";
import { workScheduleMinMaxKeys } from "@/features/work-schedule/min-max/work-schedule-min-max-keys";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { API_ERROR_MESSAGES } from "@/constants/error-messages";

const mockRouterPush = jest.fn();
const mockUpdateApi = jest.fn();
const mockDeleteApi = jest.fn();
const mockGetMinMax = jest.fn();
const mockGetPlace = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    userId: "admin-user",
    isLoaded: true,
    getToken: async () => "test-token",
  }),
}));
jest.mock("next/navigation", () => ({
  useParams: () => ({ placeId: "place-1", positionId: "pos-1", minMaxId: "min-max-1" }),
  useRouter: () => ({ push: mockRouterPush }),
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/features/work-schedule/min-max/api/mutations/update.api", () => ({
  update: (...args: unknown[]) => mockUpdateApi(...args),
}));
jest.mock("@/features/work-schedule/min-max/api/mutations/delete.api", () => ({
  deleteMinMax: (...args: unknown[]) => mockDeleteApi(...args),
}));
jest.mock("@/features/work-schedule/min-max/api/queries/get-min-max-by-id.api", () => ({
  getMinMaxById: (...args: unknown[]) => mockGetMinMax(...args),
}));
jest.mock("@/features/work-schedule/place/work-schedule-place.queries", () => ({
  workSchedulePlaceQueries: {
    queryGetWorkSchedulePlaceById: (placeId: string) => ({
      queryKey: ["place-detail", placeId],
      queryFn: () => mockGetPlace(),
      retry: false,
    }),
  },
}));

const minMax = {
  id: "min-max-1",
  min: 1,
  max: 3,
  startTime: "2026-10-24T01:00:00.000Z",
  endTime: "2026-10-24T05:00:00.000Z",
};
const listUrl = "/work-schedule/admin/place-1/position/pos-1/min-max";

function newQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
}

function mountForm(data: Omit<typeof minMax, "min" | "max"> & { min: number | null; max: number | null } = minMax) {
  const queryClient = newQueryClient();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <EditForm
        positionId="pos-1" placeTimezone="Asia/Bangkok" minMax={data}
        urlOnSuccess={listUrl} urlOnCancel={listUrl}
      />
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "บันทึกข้อมูล" }));
}

function apiError(errorCode: ErrorCode, status: number) {
  const error = new AxiosError("Request failed");
  error.response = { data: { errorCode }, status } as AxiosError["response"];
  return error;
}

describe("Min/max edit and delete", () => {
  beforeEach(() => jest.resetAllMocks());

  it("prefills counts and dates in the place timezone", () => {
    mountForm();
    expect((screen.getByLabelText(/ต่ำสุด/) as HTMLInputElement).value).toBe("1");
    expect((screen.getByLabelText(/สูงสุด/) as HTMLInputElement).value).toBe("3");
    expect((screen.getByLabelText(/เวลาเริ่มต้น/) as HTMLInputElement).value).toBe("2026-10-24T08:00");
    expect((screen.getByLabelText(/เวลาสิ้นสุด/) as HTMLInputElement).value).toBe("2026-10-24T12:00");
  });

  it.each(["min", "max"] as const)("renders a nullable %s as a blank input", (field) => {
    mountForm({ ...minMax, [field]: null });
    expect((screen.getByLabelText(field === "min" ? /ต่ำสุด/ : /สูงสุด/) as HTMLInputElement).value).toBe("");
  });

  it.each(["min", "max"] as const)("sends null when clearing %s and keeps the other count and timezone", async (field) => {
    mockUpdateApi.mockResolvedValueOnce(undefined);
    const { queryClient } = mountForm();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    fireEvent.change(screen.getByLabelText(field === "min" ? /ต่ำสุด/ : /สูงสุด/), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/เวลาเริ่มต้น/), { target: { value: "2026-10-24T09:30" } });
    submit();
    await waitFor(() => expect(mockUpdateApi).toHaveBeenCalledWith(
      "pos-1", "min-max-1", {
        min: field === "min" ? null : 1,
        max: field === "max" ? null : 3,
        start_time: "2026-10-24T02:30:00.000Z",
        end_time: "2026-10-24T05:00:00.000Z",
      }, "test-token", undefined,
    ));
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith(listUrl));
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: workScheduleMinMaxKeys.listsByPositionId("admin-user", "pos-1") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: workScheduleMinMaxKeys.detail("admin-user", "pos-1", "min-max-1") });
  });

  it.each([
    ["min", "-1"], ["min", "1.5"], ["max", "-1"], ["max", "2.5"], ["min", "4"],
  ])("blocks invalid %s=%s before calling the API", async (field, value) => {
    const { container } = mountForm();
    fireEvent.change(screen.getByLabelText(field === "min" ? /ต่ำสุด/ : /สูงสุด/), { target: { value } });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(container.querySelector("p.text-destructive")).not.toBeNull());
    expect(mockUpdateApi).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("blocks clearing both counts", async () => {
    mountForm();
    fireEvent.change(screen.getByLabelText(/ต่ำสุด/), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/สูงสุด/), { target: { value: "" } });
    submit();
    expect(await screen.findByText("min และ max ห้ามเป็นค่าว่างพร้อมกัน")).toBeTruthy();
    expect(mockUpdateApi).not.toHaveBeenCalled();
  });

  it.each(["2026-10-24T07:00", "2026-10-24T08:00"])("blocks an end time at or before the start (%s)", async (value) => {
    const { container } = mountForm();
    fireEvent.change(screen.getByLabelText(/เวลาสิ้นสุด/), { target: { value } });
    submit();
    await waitFor(() => expect(container.querySelector("p.text-destructive")).not.toBeNull());
    expect(mockUpdateApi).not.toHaveBeenCalled();
  });

  it("retains entered values and reports an update error without success or navigation", async () => {
    const error = new AxiosError("Overlap");
    error.response = { data: { message: "ช่วงเวลาทับซ้อน" }, status: 400 } as AxiosError["response"];
    mockUpdateApi.mockRejectedValueOnce(error);
    mountForm();
    fireEvent.change(screen.getByLabelText(/ต่ำสุด/), { target: { value: "2" } });
    submit();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("ช่วงเวลาทับซ้อน"));
    expect((screen.getByLabelText(/ต่ำสุด/) as HTMLInputElement).value).toBe("2");
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("disables inputs and save/cancel/delete while updating", async () => {
    let resolveUpdate!: () => void;
    mockUpdateApi.mockImplementationOnce(() => new Promise<void>((resolve) => { resolveUpdate = resolve; }));
    mountForm();
    submit();
    await waitFor(() => expect(mockUpdateApi).toHaveBeenCalledTimes(1));
    for (const input of screen.getAllByRole("spinbutton")) expect((input as HTMLInputElement).disabled).toBe(true);
    for (const button of screen.getAllByRole("button")) expect((button as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText(/เวลาเริ่มต้น/) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText(/เวลาสิ้นสุด/) as HTMLInputElement).disabled).toBe(true);
    resolveUpdate();
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith(listUrl));
  });

  it("cancels editing without a mutation", () => {
    mountForm();
    fireEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));
    expect(mockRouterPush).toHaveBeenCalledWith(listUrl);
    expect(mockUpdateApi).not.toHaveBeenCalled();
    expect(mockDeleteApi).not.toHaveBeenCalled();
  });

  it("requires delete confirmation and does not call the API when cancelled", () => {
    mountForm();
    fireEvent.click(screen.getByRole("button", { name: "ลบรายการ min/max นี้" }));
    expect(mockDeleteApi).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "ยกเลิก" }).at(-1)!);
    expect(screen.queryByRole("button", { name: "ใช่, ลบรายการนี้" })).toBeNull();
    expect(mockDeleteApi).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("deletes only after confirmation, disables controls, invalidates caches and returns to the list", async () => {
    let resolveDelete!: () => void;
    mockDeleteApi.mockImplementationOnce(() => new Promise<void>((resolve) => { resolveDelete = resolve; }));
    const { queryClient } = mountForm();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    fireEvent.click(screen.getByRole("button", { name: "ลบรายการ min/max นี้" }));
    fireEvent.click(screen.getByRole("button", { name: "ใช่, ลบรายการนี้" }));
    await waitFor(() => expect(mockDeleteApi).toHaveBeenCalledWith("pos-1", "min-max-1", "test-token", undefined));
    for (const button of screen.getAllByRole("button")) expect((button as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText(/ต่ำสุด/) as HTMLInputElement).disabled).toBe(true);
    resolveDelete();
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith(listUrl));
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: workScheduleMinMaxKeys.listsByPositionId("admin-user", "pos-1") });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: workScheduleMinMaxKeys.detail("admin-user", "pos-1", "min-max-1") });
  });

  it("reports delete failure and retains the form", async () => {
    mockDeleteApi.mockRejectedValueOnce(new Error("Network unavailable"));
    mountForm();
    fireEvent.click(screen.getByRole("button", { name: "ลบรายการ min/max นี้" }));
    fireEvent.click(screen.getByRole("button", { name: "ใช่, ลบรายการนี้" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByLabelText(/ต่ำสุด/)).toBeTruthy();
    expect(toast.success).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});

describe("Min/max detail route", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetPlace.mockResolvedValue({ id: "place-1", timezone: "Asia/Bangkok" });
    mockGetMinMax.mockResolvedValue(minMax);
  });

  function route(queryClient = newQueryClient(), minMaxId = "min-max-1") {
    return <QueryClientProvider client={queryClient}>
      <MinMaxDetailClient placeId="place-1" positionId="pos-1" minMaxId={minMaxId} />
    </QueryClientProvider>;
  }

  it("loads the chosen detail using position and ID, and prefills with place timezone", async () => {
    render(route());
    expect((await screen.findByLabelText(/เวลาเริ่มต้น/) as HTMLInputElement).value).toBe("2026-10-24T08:00");
    expect(mockGetMinMax).toHaveBeenCalledWith("pos-1", "min-max-1", "test-token", expect.any(Array));
  });

  it.each([
    [ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND, 404, listUrl],
    [ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE, 403, "/work-schedule"],
    [ErrorCode.PERSON_NOT_FOUND, 404, "/person/new"],
    [ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND, 404, "/work-schedule/admin/place-1/position"],
    [ErrorCode.WORK_SCHEDULE_PLACE_DELETED, 404, "/work-schedule"],
  ])("redirects detail error %s", async (code, status, target) => {
    mockGetMinMax.mockRejectedValue(apiError(code, status));
    render(route());
    expect(await screen.findByText(API_ERROR_MESSAGES[code])).toBeTruthy();
    expect(screen.queryByLabelText(/ต่ำสุด/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "ดำเนินการต่อ" }));
    expect(mockRouterPush).toHaveBeenCalledWith(`${target}?error=${code}`);
  });

  it("redirects a place query error", async () => {
    const code = ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND;
    mockGetPlace.mockRejectedValue(apiError(code, 404));
    render(route());
    expect(await screen.findByText(API_ERROR_MESSAGES[code])).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "ดำเนินการต่อ" }));
    expect(mockRouterPush).toHaveBeenCalledWith(`/work-schedule?error=${code}`);
  });

  it.each([
    ["update", ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND, 404, listUrl],
    ["delete", ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND, 404, listUrl],
    ["update", ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE, 403, "/work-schedule"],
    ["delete", ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE, 403, "/work-schedule"],
  ])("redirects %s error %s without success", async (operation, code, status, target) => {
    const mutationApi = operation === "update" ? mockUpdateApi : mockDeleteApi;
    mutationApi.mockRejectedValueOnce(apiError(code, status));
    render(route());
    await screen.findByLabelText(/ต่ำสุด/);
    if (operation === "update") submit();
    else {
      fireEvent.click(screen.getByRole("button", { name: "ลบรายการ min/max นี้" }));
      fireEvent.click(screen.getByRole("button", { name: "ใช่, ลบรายการนี้" }));
    }
    expect(await screen.findByText(API_ERROR_MESSAGES[code])).toBeTruthy();
    expect(mutationApi).toHaveBeenCalledTimes(1);
    expect(mutationApi.mock.calls[0].at(-1)).toContain(code);
    expect(toast.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "ดำเนินการต่อ" }));
    expect(mockRouterPush).toHaveBeenCalledWith(`${target}?error=${code}`);
  });

  it("reinitializes the form when navigating between cached details", async () => {
    const queryClient = newQueryClient();
    queryClient.setQueryData(workScheduleMinMaxKeys.detail("admin-user", "pos-1", "min-max-1"), minMax);
    queryClient.setQueryData(workScheduleMinMaxKeys.detail("admin-user", "pos-1", "min-max-2"), {
      ...minMax, id: "min-max-2", min: 2, startTime: "2026-10-24T03:00:00.000Z",
    });
    const { rerender } = render(route(queryClient));
    fireEvent.change(await screen.findByLabelText(/ต่ำสุด/), { target: { value: "3" } });
    rerender(route(queryClient, "min-max-2"));
    expect((screen.getByLabelText(/ต่ำสุด/) as HTMLInputElement).value).toBe("2");
    expect((screen.getByLabelText(/เวลาเริ่มต้น/) as HTMLInputElement).value).toBe("2026-10-24T10:00");
  });
});
