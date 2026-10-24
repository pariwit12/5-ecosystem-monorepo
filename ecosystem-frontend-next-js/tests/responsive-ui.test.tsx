import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import Home from "@/app/page";
import OrganizationsPage from "@/app/organizations/page";
import { CreatePersonForm } from "@/features/person/components/create-person-form";

let mockSignedIn = false;
const mockRouterPush = jest.fn();
const mockUseQuery = jest.fn();
const mockPersonMutate = jest.fn();
let mockPersonPending = false;

jest.mock("@clerk/nextjs", () => ({
  Show: ({
    when,
    children,
  }: {
    when: "signed-in" | "signed-out";
    children: ReactNode;
  }) => (when === (mockSignedIn ? "signed-in" : "signed-out") ? children : null),
  useAuth: () => ({
    userId: "user-1",
    getToken: jest.fn(),
    isLoaded: true,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/features/organizations/hooks/organizations.queries", () => ({
  organizationsQueries: {
    lists: jest.fn(() => ({ queryKey: ["organizations"] })),
  },
}));

jest.mock("@/features/organizations/components/create-organization-modal", () => ({
  CreateOrgModal: () => <button type="button">สร้างองค์กรใหม่</button>,
}));

jest.mock("@/features/person/hooks/use-create-person", () => ({
  useCreatePerson: () => ({
    mutate: mockPersonMutate,
    isPending: mockPersonPending,
  }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("responsive UI regressions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignedIn = false;
    mockPersonPending = false;
  });

  it("keeps Home auth branches and Work Schedule destination while using a mobile-first grid", () => {
    const signedOutView = render(<Home />);
    expect(screen.getByText("เข้าสู่ระบบเพื่อเข้าถึงแอปพลิเคชันทั้งหมด")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Work Schedule/ })).toBeNull();
    signedOutView.unmount();

    mockSignedIn = true;
    const { container } = render(<Home />);
    const scheduleLink = screen.getByRole("link", { name: /Work Schedule/ });
    expect(scheduleLink.getAttribute("href")).toBe("/work-schedule");
    expect(screen.getByRole("button", { name: "เร็วๆ นี้" }).hasAttribute("disabled")).toBe(true);
    expect(container.querySelector(".grid")?.className).toContain("grid-cols-1");
    expect(container.querySelector(".grid")?.className).toContain("md:grid-cols-3");
  });

  it("keeps organization selection navigation and responsive card layout", () => {
    mockUseQuery.mockReturnValue({
      data: {
        organizations: [{ id: "org-1", name: "คลินิกทันตกรรม" }],
      },
      isLoading: false,
    });

    const { container } = render(<OrganizationsPage />);
    expect(container.querySelector(".grid")?.className).toContain("grid-cols-1");
    expect(container.querySelector(".grid")?.className).toContain("md:grid-cols-3");
    fireEvent.click(screen.getByRole("button", { name: "ตั้งค่าองค์กร" }));
    expect(mockRouterPush).toHaveBeenCalledWith("/organizations/org-1/settings");
  });

  it("keeps Person form actions reachable and disabled while pending", () => {
    const { container, rerender } = render(<CreatePersonForm />);
    const actionGroup = container.querySelector("form > div");
    expect(actionGroup?.className).toContain("flex-col-reverse");
    expect(screen.getByRole("button", { name: "บันทึกข้อมูล" }).className).toContain("min-h-11");

    mockPersonPending = true;
    rerender(<CreatePersonForm />);
    expect((screen.getByRole("button", { name: "กำลังบันทึก..." }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "ยกเลิก" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
