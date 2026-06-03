import { create } from "zustand";
import Cookies from "js-cookie";

// 1. กำหนดหน้าตาของข้อมูลที่เราจะเก็บ
interface OrganizationState {
  activeOrgId: string | null;
  setActiveOrg: (orgId: string) => void;
  clearActiveOrg: () => void;
}

// 2. สร้างคลังข้อมูล
export const useOrganizationStore = create<OrganizationState>(
  (updateStore) => ({
    // ดึงค่าเริ่มต้นจาก Cookie ตอนที่เว็บโหลดครั้งแรก
    activeOrgId: Cookies.get("organization_id") || null,

    // ฟังก์ชันพระเอก: เซฟลง Zustand และเขียนลง Cookie ในจังหวะเดียวกัน!
    setActiveOrg: (orgId) => {
      Cookies.set("organization_id", orgId, { expires: 7 }); // ให้คุกกี้จำไว้ 7 วัน
      updateStore({ activeOrgId: orgId });
    },

    // ฟังก์ชันล้างข้อมูล (เผื่อใช้ตอนกดออกจากระบบ หรือออกจากคลินิก)
    clearActiveOrg: () => {
      Cookies.remove("organization_id");
      updateStore({ activeOrgId: null });
    },
  }),
);
