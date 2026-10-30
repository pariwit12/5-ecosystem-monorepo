import type { PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { useErrorStore } from "@/store/use-error-store";
import {
  autoCreate,
  type AutoCreateDtoBody,
} from "@/features/work-schedule/slot/api/mutations/auto-create.api";
import { useAutoCreate } from "@/features/work-schedule/slot/hooks/use-auto-create";
import { workScheduleSlotKeys } from "@/features/work-schedule/slot/work-schedule-slot-keys";

const mockGetToken = jest.fn();
jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ userId: "admin", getToken: mockGetToken }),
}));
jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));
const mockedPost = jest.mocked(apiClient.post);
const positionId = "019a01b0-0000-7000-8000-000000000001";
const templateId = "019a01b0-0000-7000-8000-000000000002";
const staffId = "019a01b0-0000-7000-8000-000000000003";
const body: AutoCreateDtoBody = {
  target_mode: "MINIMUM",
  assignment_mode: "BALANCE_TOTAL",
  start_time: "2026-10-28T08:00:00+07:00",
  end_time: "2026-10-28T18:00:00+07:00",
  slot_template_ids: [templateId],
  staff_ids: [staffId],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToken.mockResolvedValue("test-token");
  mockedPost.mockResolvedValue({ data: { createdCount: 2 } });
  useErrorStore.getState().clearError();
});

it.each([
  ["MINIMUM", "MAXIMIZE_REST"],
  ["MINIMUM", "BALANCE_TOTAL"],
  ["MAXIMUM", "MAXIMIZE_REST"],
  ["MAXIMUM", "BALANCE_TOTAL"],
] as const)(
  "posts validated target %s and assignment %s with token and returns createdCount",
  async (targetMode, assignmentMode) => {
    const requestBody = {
      ...body,
      target_mode: targetMode,
      assignment_mode: assignmentMode,
    };
    await expect(
      autoCreate(positionId, requestBody, "test-token", ["skip-code"]),
    ).resolves.toEqual({ createdCount: 2 });
    expect(mockedPost).toHaveBeenCalledWith(
      `/api/work-schedule/slot/positions/${positionId}/auto`,
      requestBody,
      {
        headers: { Authorization: "Bearer test-token" },
        skipErrorCodes: ["skip-code"],
      },
    );
  },
);

it.each([
  { slot_template_ids: [] },
  { staff_ids: [] },
  { staff_ids: [staffId, staffId] },
  { start_time: "2026-10-28T08:00:00" },
  { end_time: body.start_time },
])("blocks invalid local payload before HTTP (%j)", async (invalid) => {
  await expect(
    autoCreate(positionId, { ...body, ...invalid }, "test-token"),
  ).rejects.toThrow();
  expect(mockedPost).not.toHaveBeenCalled();
  expect(useErrorStore.getState()).toMatchObject({
    isOpen: true,
    statusCode: 400,
  });
});

it("blocks an invalid position ID before HTTP", async () => {
  await expect(autoCreate("invalid", body, "test-token")).rejects.toThrow();
  expect(mockedPost).not.toHaveBeenCalled();
});

it.each(["INVALID", ""])(
  "blocks invalid target mode %j before HTTP",
  async (targetMode) => {
    await expect(
      autoCreate(
        positionId,
        // @ts-expect-error Deliberately validate an invalid external payload.
        { ...body, target_mode: targetMode },
        "test-token",
      ),
    ).rejects.toThrow();
    expect(mockedPost).not.toHaveBeenCalled();
    expect(useErrorStore.getState()).toMatchObject({
      isOpen: true,
      statusCode: 400,
    });
  },
);

it.each(["INVALID", ""])(
  "blocks invalid assignment mode %j before HTTP",
  async (assignmentMode) => {
    await expect(
      autoCreate(
        positionId,
        // @ts-expect-error Deliberately validate an invalid external payload.
        { ...body, assignment_mode: assignmentMode },
        "test-token",
      ),
    ).rejects.toThrow();
    expect(mockedPost).not.toHaveBeenCalled();
    expect(useErrorStore.getState()).toMatchObject({
      isOpen: true,
      statusCode: 400,
    });
  },
);

it("blocks a missing assignment mode before HTTP", async () => {
  const missing: Partial<AutoCreateDtoBody> = { ...body };
  delete missing.assignment_mode;
  await expect(
    // @ts-expect-error Deliberately validate an incomplete external payload.
    autoCreate(positionId, missing, "test-token"),
  ).rejects.toThrow();
  expect(mockedPost).not.toHaveBeenCalled();
  expect(useErrorStore.getState()).toMatchObject({
    isOpen: true,
    statusCode: 400,
  });
});

function setupHook(
  targetMode: AutoCreateDtoBody["target_mode"] = "MINIMUM",
  assignmentMode: AutoCreateDtoBody["assignment_mode"] = "BALANCE_TOTAL",
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  const affected = [
    workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(
      "admin",
      positionId,
      "start1",
      "end1",
    ),
    workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(
      "admin",
      positionId,
      "start2",
      "end2",
    ),
  ];
  const untouched = [
    workScheduleSlotKeys.listsByPositionId("another-user", positionId),
    workScheduleSlotKeys.listsByPositionId("admin", "another-position"),
  ];
  [...affected, ...untouched].forEach((key) => client.setQueryData(key, []));
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useAutoCreate(), { wrapper });
  const mutate = () =>
    result.current.mutateAsync({
      positionId,
      targetMode,
      assignmentMode,
      startTime: body.start_time,
      endTime: body.end_time,
      slotTemplateIds: body.slot_template_ids,
      staffIds: body.staff_ids,
      skipErrorCodes: ["skip-code"],
    });
  return { client, affected, untouched, mutate };
}

it.each([
  ["MINIMUM", "MAXIMIZE_REST"],
  ["MINIMUM", "BALANCE_TOTAL"],
  ["MAXIMUM", "MAXIMIZE_REST"],
  ["MAXIMUM", "BALANCE_TOTAL"],
] as const)(
  "sends the hook's target %s and assignment %s in the network payload",
  async (targetMode, assignmentMode) => {
    const { mutate } = setupHook(targetMode, assignmentMode);
    await act(async () => {
      await mutate();
    });
    expect(mockedPost).toHaveBeenCalledWith(
      `/api/work-schedule/slot/positions/${positionId}/auto`,
      { ...body, target_mode: targetMode, assignment_mode: assignmentMode },
      {
        headers: { Authorization: "Bearer test-token" },
        skipErrorCodes: ["skip-code"],
      },
    );
  },
);

it.each([0, 2])(
  "invalidates every range for this user/position after createdCount=%s",
  async (createdCount) => {
    mockedPost.mockResolvedValue({ data: { createdCount } });
    const { client, affected, untouched, mutate } = setupHook();
    await act(async () => {
      expect(await mutate()).toEqual({ createdCount });
    });
    affected.forEach((key) =>
      expect(client.getQueryState(key)?.isInvalidated).toBe(true),
    );
    untouched.forEach((key) =>
      expect(client.getQueryState(key)?.isInvalidated).toBe(false),
    );
    expect(mockGetToken).toHaveBeenCalledTimes(1);
  },
);

it("rejects missing authentication without requesting or invalidating", async () => {
  mockGetToken.mockResolvedValue(null);
  const { client, affected, mutate } = setupHook();
  await act(async () => {
    await expect(mutate()).rejects.toThrow("Authentication token is missing");
  });
  expect(mockedPost).not.toHaveBeenCalled();
  affected.forEach((key) =>
    expect(client.getQueryState(key)?.isInvalidated).toBe(false),
  );
});

it("preserves cached slots when the backend rejects the plan", async () => {
  mockedPost.mockRejectedValueOnce(new Error("Infeasible plan"));
  const { client, affected, mutate } = setupHook();
  await act(async () => {
    await expect(mutate()).rejects.toThrow("Infeasible plan");
  });
  affected.forEach((key) =>
    expect(client.getQueryState(key)?.isInvalidated).toBe(false),
  );
});
