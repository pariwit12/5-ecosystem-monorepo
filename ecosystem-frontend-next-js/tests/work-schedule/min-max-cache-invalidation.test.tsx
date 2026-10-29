import { act, renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useCreate } from "@/features/work-schedule/min-max/hooks/use-create";
import { useUpdate } from "@/features/work-schedule/min-max/hooks/use-update";
import { useDelete } from "@/features/work-schedule/min-max/hooks/use-delete";
import { workScheduleMinMaxKeys } from "@/features/work-schedule/min-max/work-schedule-min-max-keys";
import { workScheduleSlotKeys } from "@/features/work-schedule/slot/work-schedule-slot-keys";

const mockCreateApi = jest.fn();
const mockUpdateApi = jest.fn();
const mockDeleteApi = jest.fn();
let mockUserId: string | null = "admin-user";

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    userId: mockUserId,
    getToken: async () => "test-token",
  }),
}));
jest.mock("@/features/work-schedule/min-max/api/mutations/create.api", () => ({
  create: (...args: unknown[]) => mockCreateApi(...args),
}));
jest.mock("@/features/work-schedule/min-max/api/mutations/update.api", () => ({
  update: (...args: unknown[]) => mockUpdateApi(...args),
}));
jest.mock("@/features/work-schedule/min-max/api/mutations/delete.api", () => ({
  deleteMinMax: (...args: unknown[]) => mockDeleteApi(...args),
}));

const userId = "admin-user";
const positionId = "pos-1";
const minMaxId = "min-max-1";
const startTime = "2026-10-24T01:00:00.000Z";
const endTime = "2026-10-24T05:00:00.000Z";
const createInput = { positionId, min: 1, max: 3, startTime, endTime };
const updateInput = {
  positionId,
  minMaxId,
  data: { min: 2, max: 4, start_time: startTime, end_time: endTime },
};

function setupCache() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const targetSlots = [
    workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(
      userId, positionId, startTime, endTime,
    ),
    workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(
      userId, positionId, "2026-10-25T01:00:00.000Z", "2026-10-25T05:00:00.000Z",
    ),
  ];
  const otherPositionSlot = workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(
    userId, "pos-2", startTime, endTime,
  );
  const otherUserSlot = workScheduleSlotKeys.listsByPositionIdStartTimeEndTime(
    "other-user", positionId, startTime, endTime,
  );
  const minMaxList = workScheduleMinMaxKeys.listsByPositionIdStartTimeEndTime(
    userId, positionId, startTime, endTime,
  );
  const minMaxDetail = workScheduleMinMaxKeys.detail(userId, positionId, minMaxId);
  const allKeys = [...targetSlots, otherPositionSlot, otherUserSlot, minMaxList, minMaxDetail];

  for (const key of allKeys) {
    queryClient.setQueryData(key, { cached: true });
  }

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  function expectInvalidated(keys: readonly QueryKey[], expected: boolean) {
    for (const key of keys) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(expected);
    }
  }

  function expectSuccessInvalidation(includeDetail: boolean) {
    expectInvalidated([minMaxList], true);
    expectInvalidated([minMaxDetail], includeDetail);
    expectInvalidated(targetSlots, true);
    expectInvalidated([otherPositionSlot, otherUserSlot], false);
  }

  return { queryClient, wrapper, allKeys, expectInvalidated, expectSuccessInvalidation };
}

describe("Min/max mutation cache invalidation", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUserId = userId;
    mockCreateApi.mockResolvedValue(undefined);
    mockUpdateApi.mockResolvedValue(undefined);
    mockDeleteApi.mockResolvedValue(undefined);
  });

  it("creates and invalidates the Min/max list and every slot range for the same position and user", async () => {
    const cache = setupCache();
    const { result } = renderHook(() => useCreate(), { wrapper: cache.wrapper });

    await act(async () => {
      await result.current.mutateAsync(createInput);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCreateApi).toHaveBeenCalledWith(
      positionId, 1, 3, startTime, endTime, "test-token", undefined,
    );
    cache.expectSuccessInvalidation(false);
  });

  it("updates and invalidates the Min/max list, detail and every slot range for the same position and user", async () => {
    const cache = setupCache();
    const { result } = renderHook(() => useUpdate(), { wrapper: cache.wrapper });

    await act(async () => {
      await result.current.mutateAsync(updateInput);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdateApi).toHaveBeenCalledWith(
      positionId, minMaxId, updateInput.data, "test-token", undefined,
    );
    cache.expectSuccessInvalidation(true);
  });

  it.each([
    { name: "string", input: minMaxId, skipErrorCodes: undefined },
    { name: "object", input: { minMaxId, skipErrorCodes: ["TEST_ERROR"] }, skipErrorCodes: ["TEST_ERROR"] },
  ])("deletes with $name input and invalidates the Min/max list, detail and matching slot ranges", async ({ input, skipErrorCodes }) => {
    const cache = setupCache();
    const { result } = renderHook(() => useDelete(positionId), { wrapper: cache.wrapper });

    await act(async () => {
      await result.current.mutateAsync(input);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDeleteApi).toHaveBeenCalledWith(positionId, minMaxId, "test-token", skipErrorCodes);
    cache.expectSuccessInvalidation(true);
  });

  it.each(["create", "update", "delete"] as const)("keeps caches valid when %s fails", async (operation) => {
    const error = new Error("Request failed");
    const api = { create: mockCreateApi, update: mockUpdateApi, delete: mockDeleteApi }[operation];
    api.mockRejectedValueOnce(error);
    const cache = setupCache();
    const { result } = renderHook(() => ({
      create: useCreate(),
      update: useUpdate(),
      delete: useDelete(positionId),
    }), { wrapper: cache.wrapper });

    await act(async () => {
      const mutation = operation === "create"
        ? result.current.create.mutateAsync(createInput)
        : operation === "update"
          ? result.current.update.mutateAsync(updateInput)
          : result.current.delete.mutateAsync(minMaxId);
      await expect(mutation).rejects.toBe(error);
    });
    await waitFor(() => expect(result.current[operation].isError).toBe(true));

    expect(api).toHaveBeenCalledTimes(1);
    cache.expectInvalidated(cache.allKeys, false);
  });

  it.each(["userId", "positionId"] as const)("preserves the create invalidation guard when %s is absent", async (missingField) => {
    if (missingField === "userId") mockUserId = null;
    const cache = setupCache();
    const invalidate = jest.spyOn(cache.queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreate(), { wrapper: cache.wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        ...createInput,
        positionId: missingField === "positionId" ? "" : positionId,
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidate).not.toHaveBeenCalled();
    cache.expectInvalidated(cache.allKeys, false);
  });
});
