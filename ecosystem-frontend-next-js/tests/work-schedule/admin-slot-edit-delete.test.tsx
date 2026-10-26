import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";

import { EditSlotForm } from "@/features/work-schedule/slot/components/edit-slot-form";
import WorkScheduleAdminPositionSlotEditClient from "@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/[slotId]/client-page";
import { workScheduleAdminPlaceIdPositionPositionIdSlotSlotIdErrorCodeRedirectList } from "@/app/work-schedule/admin/[placeId]/position/[positionId]/slot/[slotId]/error-code-redirect-list";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { workScheduleSlotKeys } from "@/features/work-schedule/slot/work-schedule-slot-keys";
import { workScheduleSlotQueries } from "@/features/work-schedule/slot/work-schedule-slot.queries";
import { API_ERROR_MESSAGES } from "@/constants/error-messages";

const mockRouterPush = jest.fn();
const mockUpdateSlotApi = jest.fn();
const mockDeleteSlotApi = jest.fn();

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    userId: "admin-user",
    isLoaded: true,
    getToken: async () => "test-token",
  }),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({
    placeId: "place-1",
    positionId: "pos-1",
    slotId: "slot-1",
  }),
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/features/work-schedule/slot/api/mutations/update-slot.api", () => ({
  updateSlot: (...args: unknown[]) => mockUpdateSlotApi(...args),
}));

jest.mock("@/features/work-schedule/slot/api/mutations/delete-slot.api", () => ({
  deleteSlot: (...args: unknown[]) => mockDeleteSlotApi(...args),
}));

const mockGetSlotById = jest.fn();
const mockGetPlaceById = jest.fn();
const mockGetSlotTypes = jest.fn();
const mockGetStaffPositions = jest.fn();

jest.mock("@/features/work-schedule/slot/api/queries/get-slot-by-id.api", () => ({
  getSlotById: (...args: unknown[]) => mockGetSlotById(...args),
}));

jest.mock("@/features/work-schedule/place/work-schedule-place.queries", () => ({
  workSchedulePlaceQueries: {
    queryGetWorkSchedulePlaceById: (placeId: string) => ({
      queryKey: ["place-detail", placeId],
      queryFn: () => mockGetPlaceById(),
      retry: false,
    }),
  },
}));

jest.mock("@/features/work-schedule/slot-type/work-schedule-slot-type.queries", () => ({
  workScheduleSlotTypeQueries: {
    queryGetSlotTypesByPositionId: (positionId: string) => ({
      queryKey: ["slot-types", positionId],
      queryFn: () => mockGetSlotTypes(),
      retry: false,
    }),
  },
}));

jest.mock("@/features/work-schedule/staff-position/work-schedule-staff-position.queries", () => ({
  workScheduleStaffPositionQueries: {
    queryGetStaffPositionsByPositionId: (positionId: string) => ({
      queryKey: ["staff-positions", positionId],
      queryFn: () => mockGetStaffPositions(),
      retry: false,
    }),
  },
}));

function newQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
}

const mockSlot = {
  id: "slot-1",
  staffId: "staff-1",
  staffName: "หมอ สมศรี",
  slotTypeId: "slot-type-1",
  slotTypeName: "กะเช้า",
  actualStartTime: "2026-10-24T01:00:00.000Z", // In Asia/Bangkok (+07:00) => 2026-10-24T08:00
  actualEndTime: "2026-10-24T05:00:00.000Z", // In Asia/Bangkok (+07:00) => 2026-10-24T12:00
};

describe("Admin Slot Edit and Delete", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("EditSlotForm Component", () => {
    it("prefills form with current values converted to place timezone", () => {
      render(
        <QueryClientProvider client={newQueryClient()}>
          <EditSlotForm
            positionId="pos-1"
            placeTimezone="Asia/Bangkok"
            slot={mockSlot}
            availableStaffPositions={[
              { staffId: "staff-1", name: "หมอ สมศรี" },
              { staffId: "staff-2", name: "หมอ สมชาย" },
            ]}
            availableSlotTypes={[
              { id: "slot-type-1", name: "กะเช้า" },
              { id: "slot-type-2", name: "กะบ่าย" },
            ]}
            urlOnSuccess="/success"
            urlOnCancel="/cancel"
          />
        </QueryClientProvider>,
      );

      const staffSelect = screen.getByLabelText(/พนักงานผู้ปฏิบัติงาน/);
      expect((staffSelect as HTMLSelectElement).value).toBe("staff-1");

      const slotTypeSelect = screen.getByLabelText(/ชนิด\/ประเภทกะการทำงาน/);
      expect((slotTypeSelect as HTMLSelectElement).value).toBe("slot-type-1");

      const startTimeInput = screen.getByLabelText(/เวลาเริ่มต้น/);
      expect((startTimeInput as HTMLInputElement).value).toBe("2026-10-24T08:00");

      const endTimeInput = screen.getByLabelText(/เวลาสิ้นสุด/);
      expect((endTimeInput as HTMLInputElement).value).toBe("2026-10-24T12:00");
    });

    it("displays inactive options when current staff or slotType are not active, and blocks update until active option is chosen", async () => {
      render(
        <QueryClientProvider client={newQueryClient()}>
          <EditSlotForm
            positionId="pos-1"
            placeTimezone="Asia/Bangkok"
            slot={mockSlot}
            availableStaffPositions={[
              { staffId: "staff-active", name: "หมอ คนใหม่" },
            ]}
            availableSlotTypes={[
              { id: "slot-type-active", name: "กะใหม่" },
            ]}
            urlOnSuccess="/success"
            urlOnCancel="/cancel"
          />
        </QueryClientProvider>,
      );

      // Verify that the inactive options are displayed with "(ไม่ active)"
      expect(
        screen.getByRole("option", { name: "หมอ สมศรี (ไม่ active)" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("option", { name: "กะเช้า (ไม่ active)" }),
      ).toBeTruthy();

      // Attempt to submit without changing inactive staff
      fireEvent.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

      await waitFor(() => {
        expect(
          screen.getByText("กรุณาเลือกพนักงานที่ active ก่อนบันทึก"),
        ).toBeTruthy();
      });

      expect(mockUpdateSlotApi).not.toHaveBeenCalled();

      fireEvent.change(screen.getByLabelText(/พนักงานผู้ปฏิบัติงาน/), {
        target: { value: "staff-active" },
      });
      fireEvent.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));
      await waitFor(() => {
        expect(
          screen.getByText("กรุณาเลือกประเภทกะที่ active ก่อนบันทึก"),
        ).toBeTruthy();
      });
      expect(mockUpdateSlotApi).not.toHaveBeenCalled();

      mockUpdateSlotApi.mockResolvedValueOnce({ id: "slot-1" });
      fireEvent.change(screen.getByLabelText(/ชนิด\/ประเภทกะการทำงาน/), {
        target: { value: "slot-type-active" },
      });
      fireEvent.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));
      await waitFor(() => {
        expect(mockUpdateSlotApi).toHaveBeenCalledTimes(1);
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it("validates that end time must be greater than start time", async () => {
      render(
        <QueryClientProvider client={newQueryClient()}>
          <EditSlotForm
            positionId="pos-1"
            placeTimezone="Asia/Bangkok"
            slot={mockSlot}
            availableStaffPositions={[
              { staffId: "staff-1", name: "หมอ สมศรี" },
            ]}
            availableSlotTypes={[
              { id: "slot-type-1", name: "กะเช้า" },
            ]}
            urlOnSuccess="/success"
            urlOnCancel="/cancel"
          />
        </QueryClientProvider>,
      );

      // Set end time earlier than start time
      fireEvent.change(screen.getByLabelText(/เวลาสิ้นสุด/), {
        target: { value: "2026-10-24T07:00" },
      });

      fireEvent.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

      await waitFor(() => {
        expect(
          screen.getByText("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้นเสมอ"),
        ).toBeTruthy();
      });

      expect(mockUpdateSlotApi).not.toHaveBeenCalled();
    });

    it("calls updateSlot with ISO strings converted from timezone, shows success toast, and navigates", async () => {
      mockUpdateSlotApi.mockResolvedValueOnce({ id: "slot-1" });
      const queryClient = newQueryClient();
      const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");

      render(
        <QueryClientProvider client={queryClient}>
          <EditSlotForm
            positionId="pos-1"
            placeTimezone="Asia/Bangkok"
            slot={mockSlot}
            availableStaffPositions={[
              { staffId: "staff-1", name: "หมอ สมศรี" },
              { staffId: "staff-2", name: "หมอ สมชาย" },
            ]}
            availableSlotTypes={[
              { id: "slot-type-1", name: "กะเช้า" },
              { id: "slot-type-2", name: "กะบ่าย" },
            ]}
            urlOnSuccess="/success"
            urlOnCancel="/cancel"
          />
        </QueryClientProvider>,
      );

      // Change staff and slot type
      fireEvent.change(screen.getByLabelText(/พนักงานผู้ปฏิบัติงาน/), {
        target: { value: "staff-2" },
      });
      fireEvent.change(screen.getByLabelText(/ชนิด\/ประเภทกะการทำงาน/), {
        target: { value: "slot-type-2" },
      });

      fireEvent.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

      await waitFor(() => {
        expect(mockUpdateSlotApi).toHaveBeenCalledWith(
          "pos-1",
          "slot-1",
          {
            staff_id: "staff-2",
            slot_type_id: "slot-type-2",
            actual_start_time: "2026-10-24T01:00:00.000Z",
            actual_end_time: "2026-10-24T05:00:00.000Z",
          },
          "test-token",
          undefined,
        );
      });

      expect(toast.success).toHaveBeenCalledWith("บันทึกการแก้ไขเวรเรียบร้อยแล้ว");
      expect(mockRouterPush).toHaveBeenCalledWith("/success");
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: workScheduleSlotKeys.listsByPositionId("admin-user", "pos-1"),
      });
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: workScheduleSlotKeys.detail("admin-user", "pos-1", "slot-1"),
      });
    });

    it("preserves form values and shows error toast when update fails", async () => {
      const axiosError = new AxiosError("Overlap error");
      axiosError.response = {
        data: { errorCode: ErrorCode.WORK_SCHEDULE_SLOT_HOLIDAY_OVERLAP },
        status: 409,
      } as AxiosError["response"];

      mockUpdateSlotApi.mockRejectedValueOnce(axiosError);

      render(
        <QueryClientProvider client={newQueryClient()}>
          <EditSlotForm
            positionId="pos-1"
            placeTimezone="Asia/Bangkok"
            slot={mockSlot}
            availableStaffPositions={[
              { staffId: "staff-1", name: "หมอ สมศรี" },
            ]}
            availableSlotTypes={[
              { id: "slot-type-1", name: "กะเช้า" },
            ]}
            urlOnSuccess="/success"
            urlOnCancel="/cancel"
          />
        </QueryClientProvider>,
      );

      fireEvent.change(screen.getByLabelText(/เวลาเริ่มต้น/), {
        target: { value: "2026-10-24T09:30" },
      });
      fireEvent.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      // Form values are preserved
      expect(
        (screen.getByLabelText(/เวลาเริ่มต้น/) as HTMLInputElement).value,
      ).toBe("2026-10-24T09:30");
      expect(mockRouterPush).not.toHaveBeenCalled();
    });

    it("disables form actions while update is pending", async () => {
      let resolveUpdate: (value: { id: string }) => void = () => undefined;
      mockUpdateSlotApi.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          }),
      );

      render(
        <QueryClientProvider client={newQueryClient()}>
          <EditSlotForm
            positionId="pos-1"
            placeTimezone="Asia/Bangkok"
            slot={mockSlot}
            availableStaffPositions={[{ staffId: "staff-1", name: "หมอ สมศรี" }]}
            availableSlotTypes={[{ id: "slot-type-1", name: "กะเช้า" }]}
            urlOnSuccess="/success"
            urlOnCancel="/cancel"
          />
        </QueryClientProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));

      await waitFor(() => {
        expect(mockUpdateSlotApi).toHaveBeenCalled();
      });
      expect(
        (screen.getByRole("button", { name: "กำลังบันทึก..." }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);
      expect((screen.getByLabelText(/พนักงานผู้ปฏิบัติงาน/) as HTMLSelectElement).disabled).toBe(true);

      resolveUpdate({ id: "slot-1" });
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "บันทึกการแก้ไขเวรเรียบร้อยแล้ว",
        );
      });
    });

    it("requires confirmation before delete; cancel does not call API, confirm calls API once and navigates", async () => {
      mockDeleteSlotApi.mockResolvedValueOnce(undefined);
      const queryClient = newQueryClient();
      const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");

      render(
        <QueryClientProvider client={queryClient}>
          <EditSlotForm
            positionId="pos-1"
            placeTimezone="Asia/Bangkok"
            slot={mockSlot}
            availableStaffPositions={[
              { staffId: "staff-1", name: "หมอ สมศรี" },
            ]}
            availableSlotTypes={[
              { id: "slot-type-1", name: "กะเช้า" },
            ]}
            urlOnSuccess="/success"
            urlOnCancel="/cancel"
          />
        </QueryClientProvider>,
      );

      // Initially, confirmation buttons are not visible
      expect(screen.queryByText("ยืนยันการลบรายการเวรนี้?")).toBeNull();

      // Click delete button to enter confirmation mode
      fireEvent.click(screen.getByRole("button", { name: "ลบรายการเวรนี้" }));
      expect(screen.getByText("ยืนยันการลบรายการเวรนี้?")).toBeTruthy();

      // Click cancel
      const cancelButtons = screen.getAllByRole("button", { name: "ยกเลิก" });
      const deleteCancelBtn = cancelButtons[cancelButtons.length - 1];
      fireEvent.click(deleteCancelBtn);

      expect(screen.queryByText("ยืนยันการลบรายการเวรนี้?")).toBeNull();
      expect(mockDeleteSlotApi).not.toHaveBeenCalled();

      // Click delete again and confirm
      fireEvent.click(screen.getByRole("button", { name: "ลบรายการเวรนี้" }));
      fireEvent.click(screen.getByRole("button", { name: "ใช่, ลบรายการนี้" }));

      await waitFor(() => {
        expect(mockDeleteSlotApi).toHaveBeenCalledWith(
          "pos-1",
          "slot-1",
          "test-token",
          undefined,
        );
      });

      expect(toast.success).toHaveBeenCalledWith("ลบรายการเวรเรียบร้อยแล้ว");
      expect(mockRouterPush).toHaveBeenCalledWith("/success");
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: workScheduleSlotKeys.listsByPositionId("admin-user", "pos-1"),
      });
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: workScheduleSlotKeys.detail("admin-user", "pos-1", "slot-1"),
      });
    });

    it("disables delete confirmation controls while deletion is pending", async () => {
      let resolveDelete: () => void = () => undefined;
      mockDeleteSlotApi.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveDelete = resolve;
          }),
      );

      render(
        <QueryClientProvider client={newQueryClient()}>
          <EditSlotForm
            positionId="pos-1"
            placeTimezone="Asia/Bangkok"
            slot={mockSlot}
            availableStaffPositions={[{ staffId: "staff-1", name: "หมอ สมศรี" }]}
            availableSlotTypes={[{ id: "slot-type-1", name: "กะเช้า" }]}
            urlOnSuccess="/success"
            urlOnCancel="/cancel"
          />
        </QueryClientProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: "ลบรายการเวรนี้" }));
      fireEvent.click(screen.getByRole("button", { name: "ใช่, ลบรายการนี้" }));

      await waitFor(() => {
        expect(mockDeleteSlotApi).toHaveBeenCalledWith(
          "pos-1",
          "slot-1",
          "test-token",
          undefined,
        );
      });
      expect(
        (screen.getByRole("button", { name: "กำลังลบ..." }) as HTMLButtonElement)
          .disabled,
      ).toBe(true);
      expect(
        (screen.getAllByRole("button", { name: "ยกเลิก" }).at(-1) as HTMLButtonElement)
          .disabled,
      ).toBe(true);

      resolveDelete();
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("ลบรายการเวรเรียบร้อยแล้ว");
      });
    });
  });

  describe("Slot detail route", () => {
    beforeEach(() => {
      mockGetPlaceById.mockResolvedValue({ id: "place-1", timezone: "Asia/Bangkok" });
      mockGetSlotTypes.mockResolvedValue({
        slotTypes: [{ id: "slot-type-1", name: "กะเช้า" }],
      });
      mockGetStaffPositions.mockResolvedValue({
        staffPositions: [{ staffId: "staff-1", name: "หมอ สมศรี" }],
      });
      mockGetSlotById.mockResolvedValue(mockSlot);
    });

    function renderRoute() {
      return render(
        <QueryClientProvider client={newQueryClient()}>
          <WorkScheduleAdminPositionSlotEditClient
            placeId="place-1"
            positionId="pos-1"
            slotId="slot-1"
          />
        </QueryClientProvider>,
      );
    }

    it("loads the selected Slot and place timezone into the form", async () => {
      renderRoute();

      const startInput = await screen.findByLabelText(/เวลาเริ่มต้น/);
      expect((startInput as HTMLInputElement).value).toBe("2026-10-24T08:00");
      expect(mockGetSlotById).toHaveBeenCalledWith(
        "pos-1", "slot-1", "test-token", expect.any(Array),
      );
    });

    it.each([
      [ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND, 404, "/work-schedule/admin/place-1/position/pos-1/slot"],
      [ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE, 403, "/work-schedule"],
      [ErrorCode.PERSON_NOT_FOUND, 404, "/person/new"],
    ])("handles detail error %s using the Work-Schedule redirect", async (errorCode, status, target) => {
      const axiosError = new AxiosError("Detail unavailable");
      axiosError.response = { data: { errorCode }, status } as AxiosError["response"];
      mockGetSlotById.mockRejectedValue(axiosError);
      renderRoute();

      expect(await screen.findByText(API_ERROR_MESSAGES[errorCode])).toBeTruthy();
      expect(screen.queryByLabelText(/เวลาเริ่มต้น/)).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "ดำเนินการต่อ" }));
      expect(mockRouterPush).toHaveBeenCalledWith(`${target}?error=${errorCode}`);
    });

    it.each([
      ["update", ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND, 404, "/work-schedule/admin/place-1/position/pos-1/slot"],
      ["delete", ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND, 404, "/work-schedule/admin/place-1/position/pos-1/slot"],
      ["update", ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE, 403, "/work-schedule"],
      ["delete", ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE, 403, "/work-schedule"],
    ])("handles %s error %s using the Work-Schedule redirect", async (operation, errorCode, status, target) => {
      const axiosError = new AxiosError("Mutation unavailable");
      axiosError.response = { data: { errorCode }, status } as AxiosError["response"];
      const mutationApi = operation === "update" ? mockUpdateSlotApi : mockDeleteSlotApi;
      mutationApi.mockRejectedValueOnce(axiosError);
      renderRoute();

      await screen.findByLabelText(/เวลาเริ่มต้น/);
      if (operation === "update") {
        fireEvent.click(screen.getByRole("button", { name: "บันทึกการแก้ไข" }));
      } else {
        fireEvent.click(screen.getByRole("button", { name: "ลบรายการเวรนี้" }));
        fireEvent.click(screen.getByRole("button", { name: "ใช่, ลบรายการนี้" }));
      }

      expect(await screen.findByText(API_ERROR_MESSAGES[errorCode])).toBeTruthy();
      expect(mutationApi).toHaveBeenCalledTimes(1);
      expect(mutationApi.mock.calls[0].at(-1)).toEqual(
        Object.keys(workScheduleAdminPlaceIdPositionPositionIdSlotSlotIdErrorCodeRedirectList),
      );
      expect(toast.success).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "ดำเนินการต่อ" }));
      expect(mockRouterPush).toHaveBeenCalledWith(`${target}?error=${errorCode}`);
    });

    it("fetches again when a cached Slot is requested under another Position", async () => {
      const queryClient = newQueryClient();
      const getToken = async () => "test-token";
      await queryClient.fetchQuery(workScheduleSlotQueries.queryGetSlotById(
        "pos-1", "slot-1", "admin-user", getToken,
      ));

      const axiosError = new AxiosError("Wrong Position");
      axiosError.response = {
        data: { errorCode: ErrorCode.WORK_SCHEDULE_SLOT_NOT_FOUND },
        status: 404,
      } as AxiosError["response"];
      mockGetSlotById.mockRejectedValueOnce(axiosError);
      await expect(queryClient.fetchQuery(workScheduleSlotQueries.queryGetSlotById(
        "pos-2", "slot-1", "admin-user", getToken,
      ))).rejects.toBe(axiosError);
      expect(mockGetSlotById).toHaveBeenCalledTimes(2);
      expect(queryClient.getQueryData(
        workScheduleSlotKeys.detail("admin-user", "pos-2", "slot-1"),
      )).toBeUndefined();
    });

    it("loads new form values when navigating between cached Slot details", async () => {
      const queryClient = newQueryClient();
      queryClient.setQueryData(
        workScheduleSlotKeys.detail("admin-user", "pos-1", "slot-1"), mockSlot,
      );
      queryClient.setQueryData(
        workScheduleSlotKeys.detail("admin-user", "pos-1", "slot-2"), {
          ...mockSlot,
          id: "slot-2",
          actualStartTime: "2026-10-24T03:00:00.000Z",
        },
      );
      const route = (slotId: string) => (
        <QueryClientProvider client={queryClient}>
          <WorkScheduleAdminPositionSlotEditClient
            placeId="place-1" positionId="pos-1" slotId={slotId}
          />
        </QueryClientProvider>
      );
      const { rerender } = render(route("slot-1"));
      fireEvent.change(await screen.findByLabelText(/เวลาเริ่มต้น/), {
        target: { value: "2026-10-24T09:30" },
      });

      rerender(route("slot-2"));
      expect((screen.getByLabelText(/เวลาเริ่มต้น/) as HTMLInputElement).value)
        .toBe("2026-10-24T10:00");
    });

    it("allows deletion when the current staff and Slot Type are inactive", async () => {
      mockGetSlotTypes.mockResolvedValue({ slotTypes: [] });
      mockGetStaffPositions.mockResolvedValue({ staffPositions: [] });
      mockDeleteSlotApi.mockResolvedValueOnce(undefined);
      renderRoute();

      expect(await screen.findByRole("option", { name: "หมอ สมศรี (ไม่ active)" }))
        .toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "ลบรายการเวรนี้" }));
      fireEvent.click(screen.getByRole("button", { name: "ใช่, ลบรายการนี้" }));

      await waitFor(() => {
        expect(mockDeleteSlotApi).toHaveBeenCalledTimes(1);
        expect(mockRouterPush).toHaveBeenCalledWith(
          "/work-schedule/admin/place-1/position/pos-1/slot",
        );
      });
    });
  });
});
