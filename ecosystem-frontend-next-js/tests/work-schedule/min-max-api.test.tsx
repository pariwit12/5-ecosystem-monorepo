import type { PropsWithChildren } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/axios";
import { useErrorStore } from "@/store/use-error-store";
import { getMinMaxById } from "@/features/work-schedule/min-max/api/queries/get-min-max-by-id.api";
import { update, type UpdateDtoBody } from "@/features/work-schedule/min-max/api/mutations/update.api";
import { deleteMinMax } from "@/features/work-schedule/min-max/api/mutations/delete.api";
import { useUpdate } from "@/features/work-schedule/min-max/hooks/use-update";
import { useDelete } from "@/features/work-schedule/min-max/hooks/use-delete";
import { workScheduleMinMaxKeys } from "@/features/work-schedule/min-max/work-schedule-min-max-keys";
import { workScheduleMinMaxQueries } from "@/features/work-schedule/min-max/work-schedule-min.queries";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

const mockGetToken = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ userId: "admin-user", getToken: mockGetToken }),
}));

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockedApi = jest.mocked(apiClient);
const positionId = "019a01b0-0000-7000-8000-000000000001";
const minMaxId = "019a01b0-0000-7000-8000-000000000002";
const otherPositionId = "019a01b0-0000-7000-8000-000000000003";
const otherMinMaxId = "019a01b0-0000-7000-8000-000000000004";
const endpoint = `/api/work-schedule/min-max/positions/${positionId}/min-maxs/${minMaxId}`;
const body: UpdateDtoBody = {
  min: 1,
  max: 3,
  start_time: "2026-10-24T08:00:00+07:00",
  end_time: "2026-10-24T12:00:00+07:00",
};
const detail = {
  id: minMaxId,
  min: 1,
  max: 3,
  startTime: "2026-10-24T01:00:00.000Z",
  endTime: "2026-10-24T05:00:00.000Z",
};

function setupQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetToken.mockResolvedValue("test-token");
  mockedApi.get.mockResolvedValue({ data: detail });
  mockedApi.patch.mockResolvedValue({ data: undefined });
  mockedApi.delete.mockResolvedValue({ data: undefined });
  useErrorStore.getState().clearError();
});

describe("Min/Max API clients", () => {
  it("reads the scoped detail with Authorization and skipped error codes", async () => {
    const skipErrorCodes = [ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND];
    await expect(getMinMaxById(positionId, minMaxId, "test-token", skipErrorCodes))
      .resolves.toEqual(detail);
    expect(mockedApi.get).toHaveBeenCalledWith(endpoint, {
      headers: { Authorization: "Bearer test-token" }, skipErrorCodes,
    });
  });

  it.each([null, 0])("sends a full nullable replacement body with min=%s", async (min) => {
    const data = { ...body, min };
    const skipErrorCodes = [ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND];
    await expect(update(positionId, minMaxId, data, "test-token", skipErrorCodes))
      .resolves.toBeUndefined();
    expect(mockedApi.patch).toHaveBeenCalledWith(endpoint, data, {
      headers: { Authorization: "Bearer test-token" }, skipErrorCodes,
    });
  });

  it("sends null to clear max and preserves the required fields", async () => {
    const data = { ...body, max: null };
    await update(positionId, minMaxId, data, "test-token");
    expect(mockedApi.patch).toHaveBeenCalledWith(endpoint, data, {
      headers: { Authorization: "Bearer test-token" }, skipErrorCodes: undefined,
    });
  });

  it("deletes the scoped detail with Authorization and default not-found handling", async () => {
    await expect(deleteMinMax(positionId, minMaxId, "test-token"))
      .resolves.toBeUndefined();
    expect(mockedApi.delete).toHaveBeenCalledWith(endpoint, {
      headers: { Authorization: "Bearer test-token" },
      skipErrorCodes: [ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND],
    });
  });

  it("forwards custom delete skip codes", async () => {
    const skipErrorCodes = [ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE];
    await deleteMinMax(positionId, minMaxId, "test-token", skipErrorCodes);
    expect(mockedApi.delete).toHaveBeenCalledWith(endpoint, {
      headers: { Authorization: "Bearer test-token" }, skipErrorCodes,
    });
  });

  it.each([
    ["invalid", minMaxId],
    [positionId, "invalid"],
    ["123e4567-e89b-42d3-a456-426614174000", minMaxId],
    [positionId, "123e4567-e89b-42d3-a456-426614174000"],
  ])("rejects invalid or non-v7 IDs before every request (%s, %s)", async (position, id) => {
    await expect(getMinMaxById(position, id, "test-token")).rejects.toThrow();
    await expect(update(position, id, body, "test-token")).rejects.toThrow();
    await expect(deleteMinMax(position, id, "test-token")).rejects.toThrow();
    expect(mockedApi.get).not.toHaveBeenCalled();
    expect(mockedApi.patch).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
    expect(useErrorStore.getState()).toMatchObject({ isOpen: true, statusCode: 400 });
  });

  it.each(["min", "max", "start_time", "end_time"] as const)(
    "rejects an omitted %s in the update body before requesting",
    async (field) => {
      const incomplete: Partial<UpdateDtoBody> = { ...body };
      delete incomplete[field];
      await expect(update(positionId, minMaxId, incomplete as UpdateDtoBody, "test-token"))
        .rejects.toThrow();
      expect(mockedApi.patch).not.toHaveBeenCalled();
      expect(useErrorStore.getState()).toMatchObject({ isOpen: true, statusCode: 400 });
    },
  );

  it.each([
    { min: undefined },
    { max: undefined },
    { start_time: undefined },
    { end_time: undefined },
    { min: null, max: null },
    { min: -1 },
    { min: 1.5 },
    { max: -1 },
    { max: 1.5 },
    { min: 4, max: 3 },
    { min: "1" },
    { start_time: "2026-10-24T08:00:00" },
    { end_time: "2026-10-24T12:00:00" },
    { end_time: body.start_time },
    { end_time: "2026-10-24T07:00:00+07:00" },
  ])("rejects invalid update values %j before requesting", async (invalid) => {
    await expect(update(positionId, minMaxId, { ...body, ...invalid } as UpdateDtoBody, "test-token"))
      .rejects.toThrow();
    expect(mockedApi.patch).not.toHaveBeenCalled();
    expect(useErrorStore.getState()).toMatchObject({ isOpen: true, statusCode: 400 });
  });
});

describe("Min/Max detail query", () => {
  it.each([
    [undefined, positionId, minMaxId],
    [null, positionId, minMaxId],
    ["", positionId, minMaxId],
    ["admin-user", "", minMaxId],
    ["admin-user", positionId, ""],
  ])("waits for user, position, and detail IDs (%s, %s, %s)", (userId, position, id) => {
    const { wrapper } = setupQueryClient();
    renderHook(() => useQuery(workScheduleMinMaxQueries.queryGetMinMaxById(
      position, id, userId, mockGetToken,
    )), { wrapper });
    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("uses all scope IDs in the cache and requests Authorization", async () => {
    const { queryClient } = setupQueryClient();
    const skipErrorCodes = [ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND];
    await queryClient.fetchQuery(workScheduleMinMaxQueries.queryGetMinMaxById(
      positionId, minMaxId, "admin-user", mockGetToken, skipErrorCodes,
    ));
    expect(queryClient.getQueryData(workScheduleMinMaxKeys.detail("admin-user", positionId, minMaxId)))
      .toEqual(detail);
    expect(mockedApi.get).toHaveBeenCalledWith(endpoint, {
      headers: { Authorization: "Bearer test-token" }, skipErrorCodes,
    });

    await queryClient.fetchQuery(workScheduleMinMaxQueries.queryGetMinMaxById(
      otherPositionId, minMaxId, "admin-user", mockGetToken,
    ));
    await queryClient.fetchQuery(workScheduleMinMaxQueries.queryGetMinMaxById(
      positionId, minMaxId, "another-user", mockGetToken,
    ));
    await queryClient.fetchQuery(workScheduleMinMaxQueries.queryGetMinMaxById(
      positionId, otherMinMaxId, "admin-user", mockGetToken,
    ));
    expect(mockedApi.get).toHaveBeenCalledTimes(4);
  });

  it("rejects a missing token without requesting the detail", async () => {
    const { queryClient } = setupQueryClient();
    mockGetToken.mockResolvedValueOnce(null);
    await expect(queryClient.fetchQuery(workScheduleMinMaxQueries.queryGetMinMaxById(
      positionId, minMaxId, "admin-user", mockGetToken,
    ))).rejects.toThrow("Authentication token is missing");
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe("Min/Max mutation cache scope", () => {
  const operations = ["update", "delete"] as const;

  function prepareMutation() {
    const { queryClient, wrapper } = setupQueryClient();
    const affectedKeys = [
      workScheduleMinMaxKeys.listsByPositionIdStartTimeEndTime("admin-user", positionId, "start-1", "end-1"),
      workScheduleMinMaxKeys.listsByPositionIdStartTimeEndTime("admin-user", positionId, "start-2", "end-2"),
      workScheduleMinMaxKeys.detail("admin-user", positionId, minMaxId),
    ];
    const untouchedKeys = [
      workScheduleMinMaxKeys.listsByPositionIdStartTimeEndTime("admin-user", otherPositionId, "start-1", "end-1"),
      workScheduleMinMaxKeys.listsByPositionIdStartTimeEndTime("another-user", positionId, "start-1", "end-1"),
      workScheduleMinMaxKeys.detail("admin-user", positionId, otherMinMaxId),
      workScheduleMinMaxKeys.detail("admin-user", otherPositionId, minMaxId),
      workScheduleMinMaxKeys.detail("another-user", positionId, minMaxId),
    ];
    [...affectedKeys, ...untouchedKeys].forEach((queryKey) => queryClient.setQueryData(queryKey, detail));
    const { result } = renderHook(() => ({ update: useUpdate(), delete: useDelete(positionId) }), { wrapper });
    const mutate = (operation: typeof operations[number]) => operation === "update"
      ? result.current.update.mutateAsync({ positionId, minMaxId, data: body })
      : result.current.delete.mutateAsync({ minMaxId });
    return { queryClient, affectedKeys, untouchedKeys, mutate };
  }

  it.each(operations)("%s invalidates every cached time range and this detail only", async (operation) => {
    const { queryClient, affectedKeys, untouchedKeys, mutate } = prepareMutation();
    await act(async () => { await mutate(operation); });
    affectedKeys.forEach((queryKey) => expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true));
    untouchedKeys.forEach((queryKey) => expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(false));
    expect(mockGetToken).toHaveBeenCalledTimes(1);
    if (operation === "update") {
      expect(mockedApi.patch).toHaveBeenCalledWith(endpoint, body, {
        headers: { Authorization: "Bearer test-token" }, skipErrorCodes: undefined,
      });
    } else {
      expect(mockedApi.delete).toHaveBeenCalledWith(endpoint, {
        headers: { Authorization: "Bearer test-token" },
        skipErrorCodes: [ErrorCode.WORK_SCHEDULE_MIN_MAX_NOT_FOUND],
      });
    }
  });

  it.each(operations)("%s leaves cache intact when the request fails", async (operation) => {
    const { queryClient, affectedKeys, mutate } = prepareMutation();
    const failure = new Error("Request failed");
    const method = operation === "update" ? mockedApi.patch : mockedApi.delete;
    method.mockRejectedValueOnce(failure);
    await act(async () => { await expect(mutate(operation)).rejects.toBe(failure); });
    affectedKeys.forEach((queryKey) => expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(false));
  });

  it.each(operations)("%s rejects a missing token without a request or invalidation", async (operation) => {
    const { queryClient, affectedKeys, mutate } = prepareMutation();
    mockGetToken.mockResolvedValueOnce(null);
    await act(async () => {
      await expect(mutate(operation)).rejects.toThrow("Authentication token is missing");
    });
    expect(mockedApi.patch).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
    affectedKeys.forEach((queryKey) => expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(false));
  });
});
