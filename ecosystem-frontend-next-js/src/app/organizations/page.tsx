"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { organizationsQueries } from "@/features/organizations/hooks/organizations.queries";

import { CreateOrgModal } from "@/features/organizations/components/create-organization-modal";
import OrganizationsLoading from "./loading";

import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { API_ERROR_MESSAGES } from "@/constants/error-messages";

function ToastNotifier() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (!errorCode) return; // ถ้าไม่มี error ใน URL ก็ไม่ต้องทำอะไรเลย

    if (errorCode === "invalid_id") {
      toast.error("รหัสองค์กรไม่ถูกต้อง");
    } else if (
      errorCode === ErrorCode.ORGANIZATION_NOT_FOUND ||
      errorCode === ErrorCode.ORGANIZATION_DELETED ||
      errorCode === ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION
    ) {
      const errorMessage = API_ERROR_MESSAGES[errorCode];
      toast.error("ไม่สามารถเข้าถึงข้อมูลองค์กรได้", {
        description: errorMessage, // <--- จะได้ข้อความที่ต่างกันตาม Error เลยครับ!
      });
    }

    // ลบ ?error=invalid_id ออกจาก URL เพื่อไม่ให้ Toast เด้งซ้ำตอนกดรีเฟรชหน้า
    window.history.replaceState(null, "", "/organizations");
  }, [searchParams]);

  return null; // ไม่ต้องแสดงผล UI อะไรออกมา
}

export default function OrganizationsPage() {
  const router = useRouter();

  // ==========================================
  // 🚀 1. ดึงข้อมูลจาก Hook (บรรทัดเดียวจบ!)
  // ==========================================
  const { getToken, userId, isLoaded } = useAuth();
  const { data, isLoading } = useQuery(
    organizationsQueries.lists(userId, getToken),
  );

  // isLoaded คือ จาก useAuth (Clerk) ป้องกันจังหวะแรกที่ยังโหลด userId ไม่เสร็จ
  if (!isLoaded || isLoading) {
    return <OrganizationsLoading />;
  }

  // แกะเอา array organizations ออกมาจาก Response (ใส่ fallback เป็น [] กันแครช)
  const organizations = data?.organizations || [];

  // ==========================================
  // 🎯 2. ฟังก์ชันจัดการเมื่อกดปุ่มตั้งค่าองค์กร
  // ==========================================
  const handleSelectOrganization = (orgId: string) => {
    router.push(`/organizations/${orgId}/settings`);
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8 relative">
      {/* ใส่ fallback={null} เพื่อบอกว่าระหว่างรอโหลด ไม่ต้องโชว์อะไร */}
      <Suspense fallback={null}>
        <ToastNotifier />
      </Suspense>
      {/* 💡 เกร็ดความรู้เพิ่มเติม: การที่เราเอา <Suspense> มาครอบไว้แบบนี้ เป็นการบอก Next.js
      ว่า "ตรงส่วนนี้มีการใช้งานข้อมูลที่ต้องรอดึงจากเบราว์เซอร์ (URL) นะ ยูสามารถข้ามไปประมวลผล (Build) หน้าจอส่วนอื่นๆ ก่อนได้เลย ไม่ต้องรอ!"
      ซึ่งจะช่วยให้ระบบ Static Rendering ของ Next.js ทำงานได้เต็มประสิทธิภาพ และผ่านฉลุยตอนสั่ง pnpm run build ครับ */}

      {/* ส่วนหัวข้อ */}
      <div className="w-full">
        <h2 className="text-3xl font-bold text-gray-800">องค์กรของคุณ</h2>
        <p className="text-gray-500 mt-2">
          จัดการและเลือกองค์กรที่คุณสังกัด หรือสร้างองค์กรใหม่
        </p>
      </div>

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
              <span className="font-mono text-xs">{org.id.slice(0, 8)}...</span>
            </p>

            {/* 🌟 ปุ่มกดเลือกองค์กร เปลี่ยนสีตามสถานะ */}
            <button
              onClick={() => handleSelectOrganization(org.id)}
              className="mt-auto px-4 py-2 font-medium rounded-lg w-full transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              ตั้งค่าองค์กร
            </button>
          </div>
        ))}

        {/* 🌟 ใช้งาน Modal สร้างองค์กร (ปุ่มจะต่อท้ายลิสต์พอดี) */}
        {/* ปิดไว้ก่อน รอพร้อมให้คนสร้างองค์กรต่างๆได้แล้วค่อยเปิด ตอนนี้เน้นสร้าง function หลักให้ครบก่อน */}
        <CreateOrgModal />
      </div>
    </div>
  );
}
