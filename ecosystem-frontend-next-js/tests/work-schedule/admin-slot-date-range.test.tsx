import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

const PERIOD_NOW = Date.parse("2026-12-31T18:30:00.000Z");
const periods = [
  {
    unit: "month",
    group: "เลือกช่วงเดือน",
    previous: "เดือนก่อนหน้า",
    current: "เดือนนี้",
    next: "เดือนถัดไป",
    range: {
      start: "2027-01-01T00:00",
      end: "2027-02-01T00:00",
      startTime: "2026-12-31T17:00:00.000Z",
      endTime: "2027-01-31T17:00:00.000Z",
      formatted: "01/01/2027 00:00 – 01/02/2027 00:00 (Asia/Bangkok)",
      timezone: "Asia/Bangkok",
    },
    nextRange: ["2027-02-01T00:00", "2027-03-01T00:00"],
    secondNextRange: ["2027-03-01T00:00", "2027-04-01T00:00"],
    previousRange: ["2026-12-01T00:00", "2027-01-01T00:00"],
    secondPreviousRange: ["2026-11-01T00:00", "2026-12-01T00:00"],
    manualNextRange: ["2028-01-01T00:00", "2028-02-01T00:00"],
  },
  {
    unit: "week",
    group: "เลือกช่วงสัปดาห์",
    previous: "สัปดาห์ก่อนหน้า",
    current: "สัปดาห์นี้",
    next: "สัปดาห์ถัดไป",
    range: {
      start: "2026-12-28T00:00",
      end: "2027-01-04T00:00",
      startTime: "2026-12-27T17:00:00.000Z",
      endTime: "2027-01-03T17:00:00.000Z",
      formatted: "28/12/2026 00:00 – 04/01/2027 00:00 (Asia/Bangkok)",
      timezone: "Asia/Bangkok",
    },
    nextRange: ["2027-01-04T00:00", "2027-01-11T00:00"],
    secondNextRange: ["2027-01-11T00:00", "2027-01-18T00:00"],
    previousRange: ["2026-12-21T00:00", "2026-12-28T00:00"],
    secondPreviousRange: ["2026-12-14T00:00", "2026-12-21T00:00"],
    manualNextRange: ["2028-01-03T00:00", "2028-01-10T00:00"],
  },
  {
    unit: "day",
    group: "เลือกช่วงวัน",
    previous: "วันก่อนหน้า",
    current: "1 วัน",
    next: "วันถัดไป",
    range: {
      start: "2027-01-01T00:00",
      end: "2027-01-02T00:00",
      startTime: "2026-12-31T17:00:00.000Z",
      endTime: "2027-01-01T17:00:00.000Z",
      formatted: "01/01/2027 00:00 – 02/01/2027 00:00 (Asia/Bangkok)",
      timezone: "Asia/Bangkok",
    },
    nextRange: ["2027-01-02T00:00", "2027-01-03T00:00"],
    secondNextRange: ["2027-01-03T00:00", "2027-01-04T00:00"],
    previousRange: ["2026-12-31T00:00", "2027-01-01T00:00"],
    secondPreviousRange: ["2026-12-30T00:00", "2026-12-31T00:00"],
    manualNextRange: ["2028-01-01T00:00", "2028-01-02T00:00"],
  },
] as const;

type PeriodControls = typeof periods[number];

function periodButton(period: PeriodControls, action: "previous" | "current" | "next") {
  return within(screen.getByRole("group", { name: period.group }))
    .getByRole("button", { name: period[action] });
}

function expectDraft(start: string, end: string) {
  const [startInput, endInput] = inputs();
  expect(startInput.value).toBe(start);
  expect(endInput.value).toBe(end);
}

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
    workScheduleHolidays: [],
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
    workScheduleHolidays: data.workScheduleHolidays,
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
  test("offers the existing slot and min/max creation routes before displaying a schedule", async () => {
    await renderPage();

    expectNoResult();
    expect(mockGetSlots).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "สร้าง Min / Max" }).getAttribute("href"))
      .toBe("/work-schedule/admin/test-place/position/test-position/min-max/new");
    expect(screen.getByRole("link", { name: "+ สร้าง workScheduleSlot ใหม่" }).getAttribute("href"))
      .toBe("/work-schedule/admin/test-place/position/test-position/slot/new/menu");
  });

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
    const empty = { workScheduleSlots: [], minMaxs: [], workScheduleHolidays: [] };
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

describe("Admin slot calendar period controls", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(PERIOD_NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test.each(periods)("fills the current $unit in the place timezone without applying or requesting it", async (period) => {
    await renderPage();
    fireEvent.click(periodButton(period, "current"));
    expectDraft(period.range.start, period.range.end);
    await act(async () => {});
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
    expect(screen.getByText("เลือกช่วงเวลาแล้วกดแสดงตารางเวร")).toBeTruthy();
  });

  test.each([
    {
      period: periods[0],
      now: PERIOD_NOW,
      start: "2026-12-01T00:00",
      end: "2027-01-01T00:00",
    },
    {
      period: periods[1],
      now: Date.parse("2026-10-25T18:30:00.000Z"),
      start: "2026-10-19T00:00",
      end: "2026-10-26T00:00",
    },
    {
      period: periods[2],
      now: PERIOD_NOW,
      start: "2026-12-31T00:00",
      end: "2027-01-01T00:00",
    },
  ])("uses UTC place metadata for the current $period.unit near a local boundary", async ({ period, now, start, end }) => {
    jest.mocked(Date.now).mockReturnValue(now);
    queryClient.setQueryData(["test-place", PLACE_ID], { id: PLACE_ID, timezone: "UTC" });
    await renderPage();
    fireEvent.click(periodButton(period, "current"));
    expectDraft(start, end);
    await act(async () => {});
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
  });

  test("starts the Bangkok week on Monday even while the same instant is Sunday in UTC", async () => {
    jest.mocked(Date.now).mockReturnValue(Date.parse("2026-10-25T18:30:00.000Z"));
    await renderPage();
    fireEvent.click(periodButton(periods[1], "current"));
    expectDraft("2026-10-26T00:00", "2026-11-02T00:00");
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
  });

  test.each(periods)("submits the $unit preset once with exclusive UTC bounds and renders the applied period", async (period) => {
    const data = response(`slot-${period.unit}`, period.range);
    mockGetSlots.mockResolvedValueOnce(data);
    await renderPage();
    fireEvent.click(periodButton(period, "current"));
    expect(mockGetSlots).not.toHaveBeenCalled();
    submit();
    await screen.findByTestId("board");
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    expectRequest(1, period.range);
    expectResult(period.range, data);
    expect(queryClient.getQueryData(slotKey(period.range))).toEqual(data);
    expect(screen.queryByText(dirtyMessage)).toBeNull();
  });

  test.each(periods)("moves $unit arrows repeatedly from the current draft across period and year boundaries", async (period) => {
    await renderPage();
    fireEvent.click(periodButton(period, "previous"));
    expectDraft(period.previousRange[0], period.previousRange[1]);
    fireEvent.click(periodButton(period, "previous"));
    expectDraft(period.secondPreviousRange[0], period.secondPreviousRange[1]);
    fireEvent.click(periodButton(period, "next"));
    expectDraft(period.previousRange[0], period.previousRange[1]);
    fireEvent.click(periodButton(period, "next"));
    expectDraft(period.range.start, period.range.end);
    fireEvent.click(periodButton(period, "next"));
    expectDraft(period.nextRange[0], period.nextRange[1]);
    fireEvent.click(periodButton(period, "next"));
    expectDraft(period.secondNextRange[0], period.secondNextRange[1]);
    await act(async () => {});
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
  });

  test("starts another arrow level from its current period instead of the previous level's draft", async () => {
    await renderPage();
    fireEvent.click(periodButton(periods[0], "previous"));
    expectDraft(periods[0].previousRange[0], periods[0].previousRange[1]);
    fireEvent.click(periodButton(periods[1], "next"));
    expectDraft(periods[1].nextRange[0], periods[1].nextRange[1]);
    fireEvent.click(periodButton(periods[2], "previous"));
    expectDraft(periods[2].previousRange[0], periods[2].previousRange[1]);
    fireEvent.click(periodButton(periods[0], "next"));
    expectDraft(periods[0].nextRange[0], periods[0].nextRange[1]);
    fireEvent.click(periodButton(periods[1], "previous"));
    expectDraft(periods[1].previousRange[0], periods[1].previousRange[1]);
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
  });

  test.each(periods)("normalizes the latest manually edited draft before another $unit arrow", async (period) => {
    await renderPage();
    fireEvent.click(periodButton(period, "current"));
    changeDraft("2027-12-31T13:45", "2028-01-20T11:30");
    fireEvent.click(periodButton(period, "next"));
    expectDraft(period.manualNextRange[0], period.manualNextRange[1]);
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
  });

  test.each(periods)("resets a navigated $unit to the current preset and uses it as the next arrow base", async (period) => {
    await renderPage();
    fireEvent.click(periodButton(period, "next"));
    fireEvent.click(periodButton(period, "next"));
    expectDraft(period.secondNextRange[0], period.secondNextRange[1]);
    fireEvent.click(periodButton(period, "current"));
    expectDraft(period.range.start, period.range.end);
    fireEvent.click(periodButton(period, "next"));
    expectDraft(period.nextRange[0], period.nextRange[1]);
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
  });

  test("keeps A and a dirty hint while shortcuts edit B, then hides A throughout an uncached B request", async () => {
    const dataA = await loadA();
    const period = periods[0];
    fireEvent.click(periodButton(period, "previous"));
    expectDraft(period.previousRange[0], period.previousRange[1]);
    fireEvent.click(periodButton(period, "next"));
    expectDraft(period.range.start, period.range.end);
    expect(screen.getByText(dirtyMessage)).toBeTruthy();
    expectResult(A, dataA);
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryState(slotKey(period.range))).toBeUndefined();

    const pending = deferred<SlotResponse>();
    const dataB = response("slot-preset-B", period.range);
    mockGetSlots.mockReturnValueOnce(pending.promise);
    submit();
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(2));
    expectRequest(2, period.range);
    expectNoResult();
    expect(screen.getByText(`ช่วงเวลาที่ร้องขอ: ${period.range.formatted}`)).toBeTruthy();
    expect(screen.getByText("กำลังโหลดตารางเวร...")).toBeTruthy();
    expectDisabled(true);
    await act(async () => pending.resolve(dataB));
    await screen.findByTestId("board");
    expectResult(period.range, dataB);
    expect(screen.queryByText(dirtyMessage)).toBeNull();
    expect(screen.queryByText(`ช่วงเวลาที่แสดงผล: ${A.formatted}`)).toBeNull();
  });

  test("applies a preset B from the existing fresh query cache only after submit", async () => {
    const dataA = await loadA();
    const period = periods[1];
    const dataB = response("cached-preset-B", period.range);
    act(() => { queryClient.setQueryData(slotKey(period.range), dataB); });
    fireEvent.click(periodButton(period, "current"));
    expectResult(A, dataA);
    expect(screen.getByText(dirtyMessage)).toBeTruthy();
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    submit();
    await waitFor(() => expectResult(period.range, dataB));
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    expectDisabled(false);
    expect(screen.queryByText(dirtyMessage)).toBeNull();
    expect(screen.queryByText("กำลังโหลดตารางเวร...")).toBeNull();
  });

  test("places all nine non-submit controls in the existing fieldset and disables them for the pending request", async () => {
    const pending = deferred<SlotResponse>();
    const period = periods[2];
    const data = response("pending-preset", period.range);
    mockGetSlots.mockReturnValueOnce(pending.promise);
    await renderPage();
    const buttons = periods.flatMap((item) => (
      ["previous", "current", "next"] as const
    ).map((action) => periodButton(item, action)));
    expect(buttons).toHaveLength(9);
    for (const button of buttons) {
      expect((button as HTMLButtonElement).type).toBe("button");
      expect(button.closest("fieldset")).toBe(form().querySelector("fieldset"));
      expect(button.matches(":disabled")).toBe(false);
      fireEvent.click(button);
    }
    await act(async () => {});
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();

    fireEvent.click(periodButton(period, "current"));
    submit();
    await waitFor(() => expect(mockGetSlots).toHaveBeenCalledTimes(1));
    expectRequest(1, period.range);
    expectDisabled(true);
    for (const button of buttons) {
      expect(button.matches(":disabled")).toBe(true);
      act(() => { (button as HTMLButtonElement).click(); });
    }
    expectDraft(period.range.start, period.range.end);
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryState(slotKey(period.range))?.fetchStatus).toBe("fetching");
    await act(async () => pending.resolve(data));
    await screen.findByTestId("board");
    for (const button of buttons) expect(button.matches(":disabled")).toBe(false);
    expectResult(period.range, data);
  });

  test.each(periods)("clears validation after successful $unit preset or arrow edits without submitting", async (period) => {
    await renderPage();
    submit();
    expect(screen.getByRole("alert").textContent).toBe("กรุณาระบุวันและเวลาเริ่มต้นและสิ้นสุด");
    fireEvent.click(periodButton(period, "current"));
    expect(screen.queryByRole("alert")).toBeNull();
    expectDraft(period.range.start, period.range.end);

    changeDraft(period.range.start, period.range.start);
    submit();
    expect(screen.getByRole("alert").textContent).toBe("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น");
    fireEvent.click(periodButton(period, "next"));
    expect(screen.queryByRole("alert")).toBeNull();
    expectDraft(period.nextRange[0], period.nextRange[1]);
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
  });

  test.each(periods)("preserves an invalid draft and reports its error when continuing a $unit arrow", async (period) => {
    await renderPage();
    fireEvent.click(periodButton(period, "current"));
    changeDraft("", period.range.end);
    fireEvent.click(periodButton(period, "next"));
    expect(screen.getByRole("alert")).toBeTruthy();
    expectDraft("", period.range.end);
    expect(mockGetSlots).not.toHaveBeenCalled();
    expectNoResult();
  });

  test("preserves the draft and applied result when shortcuts cannot use the place timezone", async () => {
    const dataA = await loadA();
    act(() => {
      queryClient.setQueryData(["test-place", PLACE_ID], { id: PLACE_ID, timezone: "Invalid/Timezone" });
    });
    await screen.findByText(dirtyMessage);
    for (const period of periods) {
      for (const action of ["previous", "current", "next"] as const) {
        fireEvent.click(periodButton(period, action));
        expect(screen.getByRole("alert").textContent).toBe("วันเวลา หรือเขตเวลาไม่ถูกต้อง");
        expectDraft(A.start, A.end);
        expectResult(A, dataA);
      }
    }
    expect(mockGetSlots).toHaveBeenCalledTimes(1);
  });
});
