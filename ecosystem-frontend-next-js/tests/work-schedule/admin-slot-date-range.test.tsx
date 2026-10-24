import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, type AxiosResponse } from "axios";
import type { ComponentProps } from "react";
import { toast } from "sonner";

import WorkScheduleAdminPositionSlotClient from "@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/client-page";
import type { WorkScheduleBoard } from "@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board";
import { getSlotsByPositionIdStartTimeEndTime } from "@/features/work-schedule/slot/api/queries/get-slots-by-position-id-start-time-end-time.api";
import { workScheduleSlotKeys } from "@/features/work-schedule/slot/work-schedule-slot-keys";
import { AccessControlErrorCode } from "@backend/common/access-control/access-control-error-code.constant";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    userId: "test-user",
    isLoaded: true,
    getToken: async () => "test-token",
  }),
}));

const mockRouterPush = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => ({ placeId: "test-place", positionId: "test-position" }),
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));

jest.mock("@/features/work-schedule/place/work-schedule-place.queries", () => ({
  workSchedulePlaceQueries: {
    queryGetWorkSchedulePlaceById: (placeId: string) => ({
      queryKey: ["test-place", placeId],
      queryFn: async () => ({ id: placeId, timezone: "Asia/Bangkok" }),
      staleTime: Infinity,
    }),
  },
}));

jest.mock("@/features/work-schedule/staff-position/work-schedule-staff-position.queries", () => ({
  workScheduleStaffPositionQueries: {
    queryGetStaffPositionsByPositionId: (positionId: string) => ({
      queryKey: ["test-staff-positions", positionId],
      queryFn: async () => ({ staffPositions: [{ staffId: "staff-1", name: "Staff One" }] }),
      staleTime: Infinity,
    }),
  },
}));

jest.mock("@/features/work-schedule/slot/api/queries/get-slots-by-position-id-start-time-end-time.api", () => ({
  getSlotsByPositionIdStartTimeEndTime: jest.fn(),
}));

jest.mock("@/features/work-schedule/slot/api/queries/get-my-work-schedule-slots.api", () => ({
  getMyWorkScheduleSlots: jest.fn(),
}));

jest.mock("@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/component-work-schedule-board", () => ({
  WorkScheduleBoard: (props: unknown) => <pre data-testid="board">{JSON.stringify(props)}</pre>,
}));

type SlotResponse = Awaited<ReturnType<typeof getSlotsByPositionIdStartTimeEndTime>>;
type BoardProps = ComponentProps<typeof WorkScheduleBoard>;
type TestRange = {
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  formatted: string;
  timezone: string;
};

const A: TestRange = {
  start: "2026-10-24T08:00",
  end: "2026-10-24T17:00",
  startTime: "2026-10-24T01:00:00.000Z",
  endTime: "2026-10-24T10:00:00.000Z",
  formatted: "24/10/2026 08:00 – 24/10/2026 17:00 (Asia/Bangkok)",
  timezone: "Asia/Bangkok",
};
const B: TestRange = {
  start: "2026-10-25T09:00",
  end: "2026-10-25T18:00",
  startTime: "2026-10-25T02:00:00.000Z",
  endTime: "2026-10-25T11:00:00.000Z",
  formatted: "25/10/2026 09:00 – 25/10/2026 18:00 (Asia/Bangkok)",
  timezone: "Asia/Bangkok",
};
const C: TestRange = {
  start: "2026-10-26T10:00",
  end: "2026-10-26T19:00",
  startTime: "2026-10-26T03:00:00.000Z",
  endTime: "2026-10-26T12:00:00.000Z",
  formatted: "26/10/2026 10:00 – 26/10/2026 19:00 (Asia/Bangkok)",
  timezone: "Asia/Bangkok",
};
const USER_ID = "test-user";
const PLACE_ID = "test-place";
const POSITION_ID = "test-position";
const dirtyMessage = "มีการเปลี่ยนช่วงเวลา กรุณากดแสดงตารางเวรเพื่ออัปเดตผลลัพธ์";
const mockGetSlots = jest.mocked(getSlotsByPositionIdStartTimeEndTime);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function response(id: string, range = A): SlotResponse {
  return {
    workScheduleSlots: [{
      id,
      staffId: "staff-1",
      staffName: "Staff One",
      slotTypeId: "slot-type-1",
      slotTypeName: "Day",
      actualStartTime: range.startTime,
      actualEndTime: range.endTime,
    }],
    minMaxs: [{ id: `min-max-${id}`, min: 1, max: 2, startTime: range.startTime, endTime: range.endTime }],
  };
}

function slotKey(range: TestRange) {
  return workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(USER_ID, POSITION_ID, range.startTime, range.endTime);
}

function form() {
  const element = screen.getByRole("button", { name: "แสดงตารางเวร" }).closest("form");
  if (!element) throw new Error("The date range form was not rendered");
  return element;
}

function inputs() {
  const elements = form().querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
  expect(elements).toHaveLength(2);
  return [elements[0], elements[1]] as const;
}

function changeDraft(start: string, end: string) {
  const [startInput, endInput] = inputs();
  fireEvent.change(startInput, { target: { value: start } });
  fireEvent.change(endInput, { target: { value: end } });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "แสดงตารางเวร" }));
}

function expectDisabled(disabled: boolean) {
  expect(form().querySelector("fieldset")?.disabled).toBe(disabled);
  for (const input of inputs()) expect(input.matches(":disabled")).toBe(disabled);
  expect(screen.getByRole("button", { name: "แสดงตารางเวร" }).matches(":disabled")).toBe(disabled);
}

function board(): BoardProps {
  return JSON.parse(screen.getByTestId("board").textContent ?? "") as BoardProps;
}

function expectResult(range: TestRange, data: SlotResponse) {
  expect(screen.getByText(`ช่วงเวลาที่แสดงผล: ${range.formatted}`)).toBeTruthy();
  expect(board()).toEqual({
    slots: data.workScheduleSlots,
    minMaxs: data.minMaxs,
    staffPositions: [{ staffId: "staff-1", name: "Staff One" }],
    startDateTime: range.startTime,
    endDateTime: range.endTime,
    timezone: range.timezone,
    placeId: PLACE_ID,
    positionId: POSITION_ID,
  });
}

function expectNoResult() {
  expect(screen.queryByTestId("board")).toBeNull();
  expect(screen.queryByText(/^ช่วงเวลาที่แสดงผล:/)).toBeNull();
}

function expectRequest(number: number, range: TestRange) {
  expect(mockGetSlots).toHaveBeenNthCalledWith(
    number, POSITION_ID, range.startTime, range.endTime, "test-token",
    AccessControlErrorCode.verifyWorkSchedulePositionByWorkScheduleAdmin,
  );
}

let queryClient: QueryClient;

async function renderPage() {
  render(
    <QueryClientProvider client={queryClient}>
      <WorkScheduleAdminPositionSlotClient placeId={PLACE_ID} positionId={POSITION_ID} />
    </QueryClientProvider>,
  );
  await screen.findByRole("button", { name: "แสดงตารางเวร" });
}

async function loadA() {
  const data = response("slot-A");
  mockGetSlots.mockResolvedValueOnce(data);
  await renderPage();
  changeDraft(A.start, A.end);
  submit();
  await screen.findByTestId("board");
  expectResult(A, data);
  return data;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSlots.mockReset();
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, gcTime: Infinity },
    },
  });
});

afterEach(() => {
  cleanup();
  queryClient.clear();
});

describe("Admin slot date range integration", () => {
  test("keeps empty and edited drafts local until a range is submitted", async () => {
    await renderPage();
    const [startInput, endInput] = inputs();
    expect(startInput.value).toBe("");
    expect(endInput.value).toBe("");
    expect(screen.getByText("เลือกช่วงเวลาแล้วกดแสดงตารางเวร")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "รีเฟรช" })).toBeNull();
    expectNoResult();

    fireEvent.change(startInput, { target: { value: A.start } });
    await act(async () => {});
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
    fireEvent.change(endInput, { target: { value: A.end } });
    await act(async () => {});
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
    expectDisabled(false);
    expect(screen.queryByText("กำลังโหลดตารางเวร...")).toBeNull();
  });

  test("submits Bangkok bounds once, disables the complete form, and publishes matching data and label", async () => {
    const pending = deferred<SlotResponse>();
    const data = response("slot-A");
    mockGetSlots.mockReturnValueOnce(pending.promise);
    await renderPage();
    expect(form().noValidate).toBe(true);
    changeDraft(A.start, A.end);
    submit();
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(1));
    expectRequest(1, A);
    expect(queryClient.getQueryState(slotKey(A))?.fetchStatus).toBe("fetching");
    expectDisabled(true);
    expect(screen.getByText(`ช่วงเวลาที่ร้องขอ: ${A.formatted}`)).toBeTruthy();
    expect(screen.getByText("กำลังโหลดตารางเวร...")).toBeTruthy();
    expectNoResult();
    await act(async () => pending.resolve(data));
    await screen.findByTestId("board");
    expectResult(A, data);
    expectDisabled(false);
    expect(screen.queryByText(/^ช่วงเวลาที่ร้องขอ:/)).toBeNull();
  });

  test("retains applied A while drafts change or clear, and clears the dirty hint when restored", async () => {
    const data = await loadA();
    changeDraft(B.start, B.end);
    expect(screen.getByText(dirtyMessage)).toBeTruthy();
    expectResult(A, data);
    changeDraft("", "");
    expect(screen.getByText(dirtyMessage)).toBeTruthy();
    expectResult(A, data);
    changeDraft(A.start, A.end);
    await act(async () => {});
    expect(screen.queryByText(dirtyMessage)).toBeNull();
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    expectResult(A, data);
    expect(queryClient.getQueryState(slotKey(B))).toBeUndefined();
  });

  test("keeps the applied timezone snapshot until submitting with updated place metadata", async () => {
    const dataA = await loadA();
    act(() => {
      queryClient.setQueryData(["test-place", PLACE_ID], { id: PLACE_ID, timezone: "UTC" });
    });
    await screen.findByText(dirtyMessage);
    expectResult(A, dataA);
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    const utcRange = {
      ...A,
      startTime: "2026-10-24T08:00:00.000Z",
      endTime: "2026-10-24T17:00:00.000Z",
      timezone: "UTC",
      formatted: "24/10/2026 08:00 – 24/10/2026 17:00 (UTC)",
    };
    const utcData = response("slot-UTC", utcRange);
    mockGetSlots.mockResolvedValueOnce(utcData);
    submit();
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(2));
    expectRequest(2, utcRange);
    await waitFor(() => expectResult(utcRange, utcData));
    expect(screen.queryByText(dirtyMessage)).toBeNull();
  });

  test.each([
    [A.start, A.start, "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น"],
    [A.end, A.start, "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น"],
    ["", A.end, "กรุณาระบุวันและเวลาเริ่มต้นและสิ้นสุด"],
    [A.start, "", "กรุณาระบุวันและเวลาเริ่มต้นและสิ้นสุด"],
    ["", "", "กรุณาระบุวันและเวลาเริ่มต้นและสิ้นสุด"],
  ])("preserves A after invalid submit (%s, %s)", async (start, end, error) => {
    const data = await loadA();
    changeDraft(start, end);
    submit();
    expect(screen.getByRole("alert").textContent).toBe(error);
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    expectResult(A, data);
    expectDisabled(false);
    changeDraft(A.start, A.end);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("hides A during an uncached B request and displays only B after success", async () => {
    await loadA();
    const pending = deferred<SlotResponse>();
    const dataB = response("slot-B", B);
    mockGetSlots.mockReturnValueOnce(pending.promise);
    changeDraft(B.start, B.end);
    submit();
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(2));
    expectRequest(2, B);
    expectNoResult();
    expect(screen.getByText(`ช่วงเวลาที่ร้องขอ: ${B.formatted}`)).toBeTruthy();
    expectDisabled(true);
    await act(async () => pending.resolve(dataB));
    await screen.findByTestId("board");
    expectResult(B, dataB);
    expect(screen.queryByText(`ช่วงเวลาที่แสดงผล: ${A.formatted}`)).toBeNull();
  });

  test("switches from A to fresh cached B using the real query key without another HTTP request", async () => {
    await loadA();
    const dataB = response("cached-slot-B", B);
    act(() => { queryClient.setQueryData(slotKey(B), dataB); });
    changeDraft(B.start, B.end);
    submit();
    await waitFor(() => expectResult(B, dataB));
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    expectDisabled(false);
  });

  test("treats empty arrays as a successful result and still renders the submitted range and Board", async () => {
    const empty = { workScheduleSlots: [], minMaxs: [] };
    mockGetSlots.mockResolvedValueOnce(empty);
    await renderPage();
    changeDraft(A.start, A.end);
    submit();
    await screen.findByTestId("board");
    expectResult(A, empty);
    expect(screen.queryByText("กำลังโหลดตารางเวร...")).toBeNull();
    expectDisabled(false);
  });

  test("keeps the form available after a first request error so another range can be submitted", async () => {
    const pending = deferred<SlotResponse>();
    mockGetSlots.mockReturnValueOnce(pending.promise);
    await renderPage();
    changeDraft(A.start, A.end);
    submit();
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(1));
    await act(async () => pending.reject(new Error("First request failed")));
    await screen.findByText("เกิดข้อผิดพลาดในการโหลดข้อมูล (error.tsx)");
    expectNoResult();
    expectDisabled(false);
    expect(screen.getByText(`ช่วงเวลาที่ร้องขอ: ${A.formatted}`)).toBeTruthy();
    const dataB = response("slot-B", B);
    mockGetSlots.mockResolvedValueOnce(dataB);
    changeDraft(B.start, B.end);
    submit();
    await screen.findByTestId("board");
    expectResult(B, dataB);
    expectRequest(2, B);
  });

  test("retries failed uncached B using the real header even with draft C, then allows submitting C", async () => {
    await loadA();
    const requestB = deferred<SlotResponse>();
    mockGetSlots.mockReturnValueOnce(requestB.promise);
    changeDraft(B.start, B.end);
    submit();
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(2));
    await act(async () => requestB.reject(new Error("B failed")));
    await screen.findByText("เกิดข้อผิดพลาดในการโหลดข้อมูล (error.tsx)");
    expectNoResult();
    expectDisabled(false);
    expect(screen.getByText(`ช่วงเวลาที่ร้องขอ: ${B.formatted}`)).toBeTruthy();
    changeDraft(C.start, C.end);
    const retryB = deferred<SlotResponse>();
    mockGetSlots.mockReturnValueOnce(retryB.promise);
    fireEvent.click(screen.getByRole("button", { name: "ลองใหม่" }));
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(3));
    expectRequest(3, B);
    expectNoResult();
    expectDisabled(true);
    await act(async () => retryB.reject(new Error("B retry failed")));
    await waitFor(() => expectDisabled(false));
    const dataC = response("slot-C", C);
    mockGetSlots.mockResolvedValueOnce(dataC);
    submit();
    await screen.findByTestId("board");
    expectResult(C, dataC);
    expectRequest(4, C);
  });

  test.each(["success", "failure"] as const)("refreshes applied A with edited draft B and preserves A on %s", async (outcome) => {
    const dataA = await loadA();
    changeDraft(B.start, B.end);
    const refresh = deferred<SlotResponse>();
    mockGetSlots.mockReturnValueOnce(refresh.promise);
    fireEvent.click(screen.getByRole("button", { name: "รีเฟรช" }));
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(2));
    expectRequest(2, A);
    expectDisabled(true);
    expectResult(A, dataA);
    expect(screen.getByText("กำลังอัปเดตข้อมูล...")).toBeTruthy();
    if (outcome === "success") {
      const refreshedA = response("slot-A-refreshed");
      await act(async () => refresh.resolve(refreshedA));
      await waitFor(() => expectResult(A, refreshedA));
    } else {
      await act(async () => refresh.reject(new Error("Refresh failed")));
      await screen.findByText("อัปเดตล่าสุดไม่สำเร็จ");
      expectResult(A, dataA);
      expect(toast.error).toHaveBeenCalledWith("ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่");
      const retry = deferred<SlotResponse>();
      mockGetSlots.mockReturnValueOnce(retry.promise);
      fireEvent.click(screen.getByRole("button", { name: "ลองใหม่" }));
      await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(3));
      expectRequest(3, A);
      expectResult(A, dataA);
      await act(async () => retry.resolve(dataA));
    }
    await waitFor(() => expectDisabled(false));
    expect(screen.queryByText(`ช่วงเวลาที่แสดงผล: ${B.formatted}`)).toBeNull();
    expect(screen.getByText(dirtyMessage)).toBeTruthy();
    expect(queryClient.getQueryState(slotKey(B))).toBeUndefined();
  });

  test("prevents native submit defaults, validates that path, and ignores pending and unchanged duplicate submits", async () => {
    const pending = deferred<SlotResponse>();
    const dataA = response("slot-A");
    mockGetSlots.mockReturnValueOnce(pending.promise);
    await renderPage();
    expect(fireEvent.submit(form())).toBe(false);
    expect(screen.getByRole("alert").textContent).toBe("กรุณาระบุวันและเวลาเริ่มต้นและสิ้นสุด");
    expect(mockGetSlots).not.toHaveBeenCalled();
    changeDraft(A.start, A.end);
    expect(fireEvent.submit(form())).toBe(false);
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(1));
    expectRequest(1, A);
    expectDisabled(true);
    expect(fireEvent.submit(form())).toBe(false);
    await act(async () => {});
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve(dataA));
    await screen.findByTestId("board");
    expect(fireEvent.submit(form())).toBe(false);
    submit();
    await act(async () => {});
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    expectResult(A, dataA);
  });

  test.each([
    [ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE, "/work-schedule"],
    [ErrorCode.WORK_SCHEDULE_POSITION_NOT_FOUND, `/work-schedule/admin/${PLACE_ID}/position`],
  ])("renders the existing RedirectUI before Board and ordinary errors for %s", async (errorCode, target) => {
    await loadA();
    const pending = deferred<SlotResponse>();
    mockGetSlots.mockReturnValueOnce(pending.promise);
    fireEvent.click(screen.getByRole("button", { name: "รีเฟรช" }));
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(2));
    const error = new AxiosError("Forbidden", "ERR_BAD_REQUEST", undefined, undefined, {
      data: { errorCode },
      status: 403,
      statusText: "Forbidden",
      headers: {},
    } as AxiosResponse);
    await act(async () => pending.reject(error));
    await screen.findByText("ระบบกำลังพาไปยังหน้าต่างที่เหมาะสม...");
    expectNoResult();
    expect(screen.queryByText("เกิดข้อผิดพลาดในการโหลดข้อมูล (error.tsx)")).toBeNull();
    expect(screen.queryByRole("button", { name: "แสดงตารางเวร" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "ดำเนินการต่อ" }));
    expect(mockRouterPush).toHaveBeenCalledWith(`${target}?error=${errorCode}`);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
