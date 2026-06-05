"use client";

import Link from "next/link";
import { useGetOrganizationById } from "@/features/organizations/hooks/use-get-organization-by-id";

// 🌟 รับ orgId ที่ผ่านการสแกนแล้วมาจาก Server Component
export default function OrganizationSettingsClient({
  orgId,
}: {
  orgId: string;
}) {
  // 🌟 ด่านที่ 2 (Client): Hook ทำงานได้อย่างปลอดภัย เพราะ Server ตรวจ orgId ให้แล้ว
  const { data: orgDetails, isLoading } = useGetOrganizationById(orgId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        กำลังโหลดข้อมูลองค์กร...
      </div>
    );
  }

  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
      {/* 🟢 ส่วนหัวข้อ และปุ่มย้อนกลับ */}
      <div className="flex items-center gap-4 border-b pb-6">
        <Link
          href="/organizations"
          className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            ตั้งค่าองค์กร: {orgDetails?.name}
          </h2>
          <p className="text-gray-500 mt-1 font-mono text-sm">
            Organization ID: {orgDetails?.id}
          </p>
        </div>
      </div>

      {/* 🟢 โซนจัดการโมดูล (Subscriptions) */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          โมดูลและแอปพลิเคชัน (Subscriptions)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* การ์ดแอป Toothcraft */}
          <div className="border border-blue-100 bg-white rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
              แนะนำ
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl">
                🦷
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">
                  Dental Clinic Information System
                </h4>
                <p className="text-sm text-gray-500">
                  ระบบบริหารจัดการคลินิกทันตกรรม
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6 flex-1">
              จัดการประวัติคนไข้ ตารางนัดหมาย ทันตแพทย์ และระบบคลังสต๊อกวัสดุ
            </p>
            <div className="flex items-center justify-between border-t pt-4">
              {orgDetails?.organizationDentalClinic ? (
                <>
                  <span className="text-sm font-medium text-gray-500">
                    สถานะ:{" "}
                    <span className="text-green-600 font-bold">
                      เปิดใช้งานแล้ว
                    </span>
                  </span>
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
                    จัดการโมดูล
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-500">
                    สถานะ:{" "}
                    <span className="text-red-500">ยังไม่เปิดใช้งาน</span>
                  </span>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                    สมัครใช้งานโมดูลนี้
                  </button>
                </>
              )}
            </div>
          </div>

          {/* การ์ดแอป HR (ตัวอย่างแอปในอนาคต) */}
          <div className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm flex flex-col opacity-75 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold text-2xl">
                👥
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">
                  HR & Payroll
                </h4>
                <p className="text-sm text-gray-500">
                  ระบบจัดการบุคคลและเงินเดือน
                </p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6 flex-1">
              คำนวณเงินเดือนหมอ หักภาษี และจัดการวันลาของพนักงานในคลินิก
            </p>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm font-medium text-gray-400">
                เร็วๆ นี้
              </span>
              <button
                disabled
                className="px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed"
              >
                ยังไม่เปิดให้บริการ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 โซนจัดการพนักงาน (รอลุยในอนาคต) */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">สมาชิกในองค์กร</h3>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
            + เชิญสมาชิก
          </button>
        </div>
        <div className="bg-white border rounded-2xl p-8 text-center text-gray-500 shadow-sm">
          ฟีเจอร์จัดการพนักงานและกำหนด Role จะแสดงที่นี่
        </div>
      </div>
    </div>
  );
}
