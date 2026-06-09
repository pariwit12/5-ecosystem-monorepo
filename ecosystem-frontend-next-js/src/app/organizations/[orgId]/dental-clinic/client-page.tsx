"use client";

import Link from "next/link";

export default function DentalClinicListClient({ orgId }: { orgId: string }) {
  // // 🔄 จำลองข้อมูลคลินิกสาขาต่างๆ (รอบรรจุ useQuery ในอนาคต)
  // const mockClinics = [
  //   // { id: "clinic-1", name: "สาขาอารีย์", status: "ACTIVE", subscriptionEndDate: "2027-01-01" },
  // ];

  return (
    <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
      {/* 🟢 ส่วนหัวข้อและทางย้อนกลับ */}
      <div className="flex items-center gap-4 border-b pb-6">
        <Link
          href={`/organizations/${orgId}/settings`}
          className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all"
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
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              ระบบบริหารคลินิกทันตกรรม
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              จัดการสาขาและสิทธิการใช้งานของคลินิกในเครือ
            </p>
          </div>
          <Link
            href={`/organizations/${orgId}/dental-clinic/new`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm"
          >
            + เพิ่มสาขาคลินิกใหม่
          </Link>
        </div>
      </div>

      {/* 🟢 ส่วนแสดงรายชื่อคลินิก (Empty State vs Data Grid) */}
      {/* {mockClinics.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-gray-50/50">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4">
            🏢
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            ยังไม่มีคลินิกในองค์กรนี้
          </h3>
          <p className="text-gray-500 max-w-md mb-6 text-sm leading-relaxed">
            เริ่มต้นใช้งานระบบ Toothcraft ด้วยการสร้างโปรไฟล์คลินิกสาขาแรกของคุณ
            เพื่อเปิดใช้งานระบบนัดหมายและประวัติคนไข้แยกตามสาขา
          </p>
          <Link
            href={`/organizations/${orgId}/dental-clinic/new`}
            className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all text-sm shadow-md"
          >
            สร้างคลินิกสาขาแรก
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockClinics.map((clinic) => (
            <div
              key={clinic.id}
              className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm flex flex-col hover:border-gray-300 transition-all"
            >
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                {clinic.name}
              </h4>
              <p className="text-sm text-gray-500 flex-1">
                สถานะ:{" "}
                <span className="text-green-600 font-medium">เปิดใช้งาน</span>
              </p>
              <div className="mt-4 pt-4 border-t">
                <Link
                  href={`/organizations/${orgId}/dental-clinic/${clinic.id}/dashboard`}
                  className="w-full block text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
                >
                  เข้าสู่หน้าแอดมินสาขา
                </Link>
              </div>
            </div>
          ))}
        </div>
      )} */}
    </div>
  );
}
