import { create } from "zustand";

interface ErrorState {
  isOpen: boolean;
  title: string;
  message: string;
  statusCode?: number; // (number | undefined)
}

interface ErrorActions {
  showError: (title: string, message: string, statusCode?: number) => void;
  clearError: () => void;
}

export const useErrorStore = create<ErrorState & ErrorActions>((set) => ({
  // สถานะเริ่มต้น (ไม่มี Error)
  isOpen: false,
  title: "",
  message: "",
  statusCode: undefined,

  // ฟังก์ชันสั่งเปิด Modal (จะถูกเรียกใช้โดย Axios Interceptor ในอนาคต)
  showError: (title, message, statusCode) =>
    set({ isOpen: true, title, message, statusCode }),

  // ฟังก์ชันสั่งปิด Modal (เมื่อผู้ใช้กดยอมรับ)
  clearError: () =>
    set({ isOpen: false, title: "", message: "", statusCode: undefined }),
}));
