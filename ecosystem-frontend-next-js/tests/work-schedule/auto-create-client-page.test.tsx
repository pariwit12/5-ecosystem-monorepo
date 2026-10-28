import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WorkScheduleAdminPositionSlotAutoClient from "@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/auto/client-page";

const mockPosition = jest.fn();
const mockPlace = jest.fn();
const mockMutate = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ userId: "admin", isLoaded: true, getToken: async () => "token" }),
}));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/hooks/use-effect-check-error", () => ({
  useEffectCheckError: () => ({ isRedirecting: false }),
}));
jest.mock("@/features/work-schedule/slot/hooks/use-auto-create", () => ({
  useAutoCreate: () => ({ mutate: mockMutate, isPending: false }),
}));
jest.mock("@/components/children-header", () => ({
  ChildrenHeader: ({ backHref }: { backHref: string }) => <a href={backHref}>Back</a>,
}));
jest.mock("@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/error", () => ({
  __esModule: true,
  default: () => <div>Query error</div>,
}));
jest.mock("@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/new/loading", () => ({
  __esModule: true,
  default: () => <div>Loading query</div>,
}));
jest.mock("@/features/work-schedule/position/work-schedule-position.queries", () => ({
  workSchedulePositionQueries: {
    queryGetWorkSchedulePositionById: (id: string) => ({
      queryKey: ["position", id], queryFn: () => mockPosition(id),
    }),
  },
}));
jest.mock("@/features/work-schedule/place/work-schedule-place.queries", () => ({
  workSchedulePlaceQueries: {
    queryGetWorkSchedulePlaceById: (id: string) => ({
      queryKey: ["place", id], queryFn: () => mockPlace(id), enabled: !!id,
    }),
  },
}));
jest.mock("@/features/work-schedule/slot-template/work-schedule-slot-template.queries", () => ({
  workScheduleSlotTemplateQueries: {
    queryGetSlotTemplatesByPositionId: (id: string) => ({
      queryKey: ["templates", id],
      queryFn: async () => ({ slotTemplates: [{ id: "template", name: "Morning" }] }),
    }),
  },
}));
jest.mock("@/features/work-schedule/staff-position/work-schedule-staff-position.queries", () => ({
  workScheduleStaffPositionQueries: {
    queryGetStaffPositionsByPositionId: (id: string) => ({
      queryKey: ["staff", id],
      queryFn: async () => ({ staffPositions: [{ staffId: "staff", name: "Staff" }] }),
    }),
  },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WorkScheduleAdminPositionSlotAutoClient placeId="url-place" positionId="position" />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPosition.mockResolvedValue({ name: "Position", placeId: "actual-place" });
  mockPlace.mockImplementation(async (id: string) => ({
    timezone: id === "actual-place" ? "America/New_York" : "Asia/Bangkok",
  }));
});

it("uses the Position's Place for timezone and navigation when the URL names another Place", async () => {
  renderPage();
  expect(await screen.findByText(/วันที่และเวลาอ้างอิงเขตเวลา America\/New_York/)).toBeTruthy();
  expect(mockPosition).toHaveBeenCalledWith("position");
  expect(mockPlace).toHaveBeenCalledTimes(1);
  expect(mockPlace).toHaveBeenCalledWith("actual-place");
  expect(screen.getByRole("link", { name: "Back" }).getAttribute("href")).toBe(
    "/work-schedule/admin/actual-place/position/position/slot/new/menu",
  );
  fireEvent.change(screen.getByLabelText("เวลาเริ่มต้น"), { target: { value: "2026-10-28T08:00" } });
  fireEvent.change(screen.getByLabelText("เวลาสิ้นสุด"), { target: { value: "2026-10-28T18:00" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Morning" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Staff" }));
  fireEvent.click(screen.getByRole("button", { name: "จัดเวรอัตโนมัติ" }));
  await waitFor(() => expect(mockMutate).toHaveBeenCalledTimes(1));
  expect(mockMutate.mock.calls[0][0]).toMatchObject({
    startTime: "2026-10-28T08:00:00.000-04:00",
    endTime: "2026-10-28T18:00:00.000-04:00",
  });
});

it("waits for the Position before fetching its Place or displaying the form", async () => {
  mockPosition.mockImplementation(() => new Promise(() => {}));
  renderPage();
  expect(await screen.findByText("Loading query")).toBeTruthy();
  expect(mockPlace).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "จัดเวรอัตโนมัติ" })).toBeNull();
});

it("shows an error without fetching Place when Position lookup fails", async () => {
  mockPosition.mockRejectedValue(new Error("Position unavailable"));
  renderPage();
  expect(await screen.findByText("Query error")).toBeTruthy();
  expect(mockPlace).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "จัดเวรอัตโนมัติ" })).toBeNull();
});
