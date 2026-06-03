"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// 🌟 นำเข้าระบบที่เราตั้งค่าไว้
import apiClient from "@/lib/axios";
import { useOrganizationStore } from "@/store/use-organization-store";

import { useOrganizations } from "@/features/organizations/hooks/useGetOrganizations";

import { CreateOrgModal } from "@/features/organizations/components/create-organization-modal";

// กำหนดหน้าตาข้อมูลองค์กร (ปรับให้ตรงกับ Prisma ของคุณ)
interface Organization {
  id: string;
  name: string;
}

export default function OrganizationsPage() {
  const { getToken } = useAuth();

  // 🌟 เรียกใช้ Router
  const router = useRouter();
  const queryClient = useQueryClient(); // 🌟 ผู้จัดการ Cache
  const { activeOrgId, setActiveOrg } = useOrganizationStore(); // ดึงฟังก์ชัน/ตัวแปรจาก Store

  const [isSelectingOrg, setIsSelectingOrg] = useState(false); // สถานะกำลังกดเลือกองค์กร

  // ==========================================
  // [GET] ฟังก์ชันสำหรับดึงข้อมูลองค์กรทั้งหมด ด้วย useQuery (แทน useEffect)
  // ==========================================
  const {
    data: organizations = [],
    isLoading,
    // isError,
  } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiClient.get<{ organizations: Organization[] }>(
        "/api/organizations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data.organizations || []; // ป้องกันกรณี response ไม่มี organizations มาเลย
    },
  });

  // หลังย้าย hooks ไปที่ไฟล์แยกแล้ว ก็แค่เรียกใช้ useOrganizations() แทนการเขียน useQuery ซ้ำๆ ในแต่ละหน้า
  const { data: organizations = [], isLoading } = useOrganizations();

  // ==========================================
  // [POST] ฟังก์ชันสำหรับสร้างองค์กรใหม่
  // ==========================================
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = await getToken();
      const response = await apiClient.post(
        "/api/organizations",
        { name },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    },
    onSuccess: () => {
      // 🌟 ท่าไม้ตาย! สั่งให้ตารางรีเฟรชข้อมูลใหม่ทันที
      queryClient.invalidateQueries({ queryKey: ["organizations"] });

      // ปิด Modal และล้างฟอร์ม
      setIsModalOpen(false);
      setNewOrgName("");
    },
    // 💡 สังเกตว่าเราไม่ต้องเขียน onError เพื่อโชว์ข้อความแดงๆ แล้ว เพราะ Global Modal รับจบให้!
  });

  // 🌟 (อัปเดต 3) ฟังก์ชันจัดการเมื่อกดปุ่มองค์กร
  const handleSelectOrganization = (orgId: string) => {
    setIsSelectingOrg(true);

    // 1. สั่งเซฟลง Zustand และ Cookie
    setActiveOrg(orgId);

    // 2. Redirect ไปหน้าตั้งค่าขององค์กรนั้น (แก้ URL ปลายทางได้ตามต้องการ)
    router.push(`/organizations/settings`);
    setIsSelectingOrg(false);
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8 relative">
      {/* ส่วนหัวข้อ */}
      <div className="w-full">
        <h2 className="text-3xl font-bold text-gray-800">องค์กรของคุณ</h2>
        <p className="text-gray-500 mt-2">
          จัดการและเลือกองค์กรที่คุณสังกัด หรือสร้างองค์กรใหม่
        </p>
      </div>

      {/* 🎯 2. แสดงสถานะ Loading, Error หรือ โชว์ข้อมูล */}
      {/* Error โดนตัดทิ้งเพราะมี Global Modal แล้ว */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-gray-400">
          กำลังโหลดข้อมูล...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ลูปแสดงการ์ดองค์กรทั้งหมดที่มี */}
          {organizations.map((org) => (
            <div
              key={org.id}
              className="p-6 border rounded-2xl shadow-sm bg-white hover:shadow-md transition-all flex flex-col items-start"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 font-bold text-xl">
                {/* เอาตัวอักษรตัวแรกของชื่อมาทำเป็นโลโก้จำลอง */}
                {org.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-gray-800">{org.name}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-6">
                ID:{" "}
                <span className="font-mono text-xs">
                  {org.id.slice(0, 8)}...
                </span>
              </p>

              {/* 🌟 (อัปเดต 4) ปุ่มกดเลือกองค์กร เปลี่ยนสีตามสถานะ */}
              <button
                onClick={() => handleSelectOrganization(org.id)}
                className={`mt-auto px-4 py-2 font-medium rounded-lg w-full transition-colors ${
                  activeOrgId === org.id && isSelectingOrg
                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {activeOrgId === org.id && isSelectingOrg
                  ? "กำลังจัดการองค์กรนี้"
                  : "ตั้งค่าองค์กร"}
              </button>
            </div>
          ))}

          {/* 🌟 ใช้งาน Modal ตรงนี้ จบปิ๊ง! (ลอจิกการเปิด/ปิด ซ่อนอยู่ข้างใน) */}
          <CreateOrgModal />
        </div>
      )}
    </div>
  );
}
