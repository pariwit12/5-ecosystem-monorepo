// -----------------------------------------------------------
// UI Template
// -----------------------------------------------------------

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { USER_ERROR_MESSAGES } from "@/constants/error-messages";

// ----------- Import Form -----------
import {
  // ปรับตามใช้งานจริง
  MethodTemplateForm,

  // ปรับตามใช้งานจริง
} from "@/features/[template]/components/method-[template]-form";

// ==========================================
// 🛡️ Component ดักจับ Error จาก URL
// ==========================================

function ToastNotifier() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get(
      // ปรับตามใช้งานจริง
      "error",
    );

    // ปรับตามใช้งานจริง
    if (!errorCode) return; // ถ้าไม่มี error ใน URL ก็ไม่ต้องทำอะไรเลย

    // ปรับตามใช้งานจริง
    if (errorCode === "invalid_id") {
      //
      // ปรับตามใช้งานจริง
      toast.error(
        //
        // ปรับตามใช้งานจริง
        "รหัสองค์กรไม่ถูกต้อง",
      );

      // ปรับตามใช้งานจริง
    } else if (
      //
      // ปรับตามใช้งานจริง
      errorCode === ErrorCode.ORGANIZATION_NOT_FOUND ||
      errorCode === ErrorCode.ORGANIZATION_DELETED ||
      errorCode === ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION
    ) {
      // ปรับตามใช้งานจริง
      const errorMessage = USER_ERROR_MESSAGES[errorCode]; // ใช้ "ข้อความ" ที่เตรียมไว้ใน USER_ERROR_MESSAGES

      // ปรับตามใช้งานจริง
      toast.error("ไม่สามารถเข้าถึงข้อมูลได้", {
        description: errorMessage, // <--- จะได้ข้อความที่ต่างกันตาม Error เลยครับ!
      });
    }

    // ลบ ?error=... ออกจาก URL โดยคงพาทปัจจุบันไว้ (เพื่อไม่ให้ Toast เด้งซ้ำตอนกดรีเฟรชหน้า)
    window.history.replaceState(
      null,
      "",
      window.location.pathname, // URL ที่จะแทนที่
    );

    // วิธีการใช้งาน window.location

    // สมมติว่า URL เต็มๆ บนหน้าจอของผู้ใช้ตอนนี้คือ: https://www.yourdomain.com/template/123?error=invalid_id
    // window.location.origin   จะได้ค่าเป็น https://www.yourdomain.com (ส่วนโดเมนหลัก)
    // window.location.pathname จะได้ค่าเป็น /template/123 (ส่วนเส้นทางหน้าเว็บ) 👈 พระเอกของเราอยู่ตรงนี้ครับ!
    // window.location.search   จะได้ค่าเป็น ?error=invalid_id (ส่วน Query Parameters ทั้งหมด)
    // window.location.hash     จะได้ค่าเป็น #section1 (ถ้ามีการกระโดดไปตามจุดต่างๆ ของหน้า)
    //
  }, [searchParams]);

  return null; // ไม่ต้องแสดงผล UI อะไรออกมา
}

// ==========================================
// 🛡️ (จบ) Component ดักจับ Error จาก URL
// ==========================================

// ===========================================
// ⏱️ ส่วนทดสอบ Loading: หน่วงเวลา 5 วินาที
// ===========================================

await new Promise((resolve) => setTimeout(resolve, 5000));

// ===========================================
// ⏱️ (จบ) ส่วนทดสอบ Loading: หน่วงเวลา 5 วินาที
// ===========================================

// ==========================================
// 🖥️ Component หลัก
// ==========================================

export default function TemplatePage() {
  //
  const templateData = [
    { id: "UUID1", name: "test1" },
    { id: "UUID2", name: "test2" },
    { id: "UUID3", name: "test3" },
  ];
  const templateId = "123";

  // ==================
  // ส่วนแสดงผล UI หลัก
  // ==================

  return (
    <>
      {/* ===================================== */}
      {/* Toast สำหรับ Error ที่มาพร้อมกับ URL */}
      {/* ===================================== */}

      <Suspense
        // Suspense คือ การบอกว่าข้างในนี้อาจจะโหลดช้ากว่าส่วนอื่น ให้ไปรันโค้ดส่วนอื่นก่อนได้เลย
        // เช่น ต้องดึงข้อมูลจาก URL เป็นต้น
        //
        fallback={null}
        // fallback คือ ระหว่างโหลด ให้แสดงอะไรรอ
        // ถ้าโค้ดข้างใน ไม่ได้ return UI อะไร ให้ใส่ {null}
        // ถ้าโค้ดข้างใน มี return UI ให้ใส่ {skeleton} ของ โค้ดนั้น
      >
        <ToastNotifier />
      </Suspense>

      {/* ========================================================================================== */}
      {/* Main UI (children) */}
      {/* ========================================================================================== */}

      <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8 relative">
        {/*  */}
        {/* ============================ */}
        {/* ชื่อตาราง + Create Button */}
        {/* ============================ */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          {/*  */}
          {/* ============ */}
          {/* ชื่อตาราง */}
          {/* ============ */}

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {/* 
                -------- ปรับตามใช้งานจริง --------
              */}
              รายการเทมเพลต
              {/* 
                --------------------------------
              */}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              {/* 
                -------- ปรับตามใช้งานจริง --------
              */}
              จัดการและตรวจสอบข้อมูลรายการทั้งหมดในระบบ
              {/* 
                --------------------------------
              */}
            </p>
          </div>

          {/* ============ */}
          {/* (จบ) ชื่อตาราง */}
          {/* ============ */}

          {/* ================== */}
          {/* Create Button */}
          {/* ================== */}

          <Link
            href={
              //
              `/template/${templateId}/server-query` // ปรับตามใช้งานจริง
              //
            }
            className="inline-flex items-center justify-center px-5 py-2.5 font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-colors shrink-0"
          >
            <span>
              {/* 
                -------- ปรับตามใช้งานจริง --------
              */}
              + สร้างข้อมูลใหม่
              {/* 
                --------------------------------
              */}
            </span>
          </Link>

          {/* ================== */}
          {/* (จบ) Create Button */}
          {/* ================== */}
          {/*  */}
        </div>

        {/* ============================ */}
        {/* (จบ) ชื่อตาราง + Create Button */}
        {/* ============================ */}

        {/* ===================== */}
        {/* ส่วนแสดงผล: การ์ด */}
        {/* ===================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/*  */}
          {/* ======================================== */}
          {/* 🌟 ปุ่มสร้างข้อมูลใหม่ในรูปแบบ Ghost Card */}
          {/* ======================================== */}

          <Link
            href={
              //
              `/template/${templateId}/server-query` // ปรับตามใช้งานจริง
              //
            }
            className="p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all flex flex-col items-center justify-center text-gray-500 group min-h-50"
          >
            <div className="w-12 h-12 rounded-full bg-white border shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="font-bold text-lg">
              {/* 
                -------- ปรับตามใช้งานจริง --------
              */}
              สร้างข้อมูลใหม่
              {/* 
                --------------------------------
              */}
            </span>
          </Link>

          {/* ======================================== */}
          {/* 🌟 (จบ) ปุ่มสร้างข้อมูลใหม่ในรูปแบบ Ghost Card */}
          {/* ======================================== */}

          {/* ==================== */}
          {/* 🌟 Render ข้อมูล */}
          {/* ==================== */}

          {
            //
            templateData // ปรับตามใช้งานจริง
              //
              .map(
                (
                  //
                  temp, // ปรับตามใช้งานจริง
                  //
                ) => (
                  <div
                    key={
                      //
                      temp.id // ปรับตามใช้งานจริง
                      //
                    }
                    className="p-6 border rounded-2xl shadow-sm bg-white hover:shadow-md transition-all flex flex-col items-start"
                  >
                    {/*  */}
                    {/* ============= */}
                    {/* 🌟 โลโก้ */}
                    {/* ============= */}

                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 font-bold text-xl">
                      {/* เอาตัวอักษรตัวแรกของชื่อมาทำเป็นโลโก้จำลอง */}
                      {
                        //
                        temp.name // ปรับตามใช้งานจริง
                          //
                          .charAt(0)
                          .toUpperCase()
                      }
                    </div>

                    {/* ============= */}
                    {/* 🌟 (จบ) โลโก้ */}
                    {/* ============= */}

                    {/* ====================== */}
                    {/* 🌟 ชื่อเต็มของรายการ */}
                    {/* ====================== */}

                    <h3 className="text-lg font-bold text-gray-800">
                      {
                        //
                        temp.name // ปรับตามใช้งานจริง
                        //
                      }
                    </h3>

                    {/* ====================== */}
                    {/* 🌟 (จบ) ชื่อเต็มของรายการ */}
                    {/* ====================== */}

                    {/* ================= */}
                    {/* 🌟 รายละเอียด */}
                    {/* ================= */}

                    <p className="text-sm text-gray-500 mt-1 mb-6">
                      {/* 
                        -------- ปรับตามใช้งานจริง --------
                      */}
                      ID:{" "}
                      <span className="font-mono text-xs">
                        {temp.id.slice(0, 8)}...
                      </span>
                      {/* 
                        --------------------------------
                      */}
                    </p>

                    {/* ================= */}
                    {/* 🌟 (จบ) รายละเอียด */}
                    {/* ================= */}

                    {/* ================= */}
                    {/* 🌟 ปุ่มกดเลือก */}
                    {/* ================= */}

                    <Link
                      href={
                        //
                        `/template/${temp.id}/server-query` // ปรับตามใช้งานจริง
                        //
                      }
                      className="mt-auto px-4 py-2 font-medium rounded-lg w-full transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      {/* 
                        -------- ปรับตามใช้งานจริง --------
                      */}
                      เลือก...
                      {/* 
                        --------------------------------
                      */}
                    </Link>

                    {/* ================= */}
                    {/* 🌟 (จบ) ปุ่มกดเลือก */}
                    {/* ================= */}
                    {/*  */}
                  </div>
                ),
              )
          }

          {/* ==================== */}
          {/* 🌟 (จบ) Render ข้อมูล */}
          {/* ==================== */}
          {/*  */}
        </div>

        {/* ===================== */}
        {/* (จบ) ส่วนแสดงผล: การ์ด */}
        {/* ===================== */}

        {/* ========================================================= */}
        {/* ส่วนแสดงผล: Stacked List (สำหรับข้อมูลที่มี Column ไม่เยอะ) */}
        {/* ========================================================= */}

        <div className="w-full border border-gray-200 rounded-xl shadow-sm bg-white divide-y divide-gray-100">
          {
            //
            templateData // ปรับตามใช้งานจริง
              //
              .map(
                (
                  //
                  temp, // ปรับตามใช้งานจริง
                  //
                ) => (
                  <div
                    key={
                      //
                      temp.id // ปรับตามใช้งานจริง
                      //
                    }
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 gap-4 hover:bg-gray-50/50 transition-colors"
                  >
                    {/*  */}
                    {/* ================= */}
                    {/* ฝั่งซ้าย: ข้อมูล */}
                    {/* ================= */}

                    <div className="flex items-center gap-4">
                      {/*  */}
                      {/* ================ */}
                      {/* โลโก้แบบกลม */}
                      {/* ================ */}

                      <div className="w-10 h-10 shrink-0 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {
                          //
                          temp.name // ปรับตามใช้งานจริง
                            //
                            .charAt(0)
                            .toUpperCase()
                        }
                      </div>

                      {/* ================ */}
                      {/* (จบ) โลโก้แบบกลม */}
                      {/* ================ */}

                      {/* ========================== */}
                      {/* รายละเอียด (ถัดจากโลโก้) */}
                      {/* ========================== */}

                      <div>
                        {/*  */}
                        {/* ====================== */}
                        {/* 🌟 ชื่อเต็มของรายการ */}
                        {/* ====================== */}

                        <h3 className="text-base font-semibold text-gray-800">
                          {
                            //
                            temp.name // ปรับตามใช้งานจริง
                            //
                          }
                        </h3>

                        {/* ====================== */}
                        {/* 🌟 (จบ) ชื่อเต็มของรายการ */}
                        {/* ====================== */}

                        {/* ================= */}
                        {/* 🌟 รายละเอียด */}
                        {/* ================= */}

                        <p className="text-sm text-gray-500 font-mono mt-0.5">
                          {/* 
                            -------- ปรับตามใช้งานจริง --------
                          */}
                          ID: {temp.id.slice(0, 8)}...
                          {/* 
                            --------------------------------
                          */}
                        </p>

                        {/* ================= */}
                        {/* 🌟 (จบ) รายละเอียด */}
                        {/* ================= */}
                        {/*  */}
                      </div>

                      {/* ========================== */}
                      {/* (จบ) รายละเอียด (ถัดจากโลโก้) */}
                      {/* ========================== */}
                      {/*  */}
                    </div>

                    {/* ================= */}
                    {/* (จบ) ฝั่งซ้าย: ข้อมูล */}
                    {/* ================= */}

                    {/* ================== */}
                    {/* ฝั่งขวา: Action */}
                    {/* ================== */}

                    <Link
                      href={
                        //
                        `/template/${temp.id}/server-query` // ปรับตามใช้งานจริง
                        //
                      }
                      className="w-full sm:w-auto px-6 py-2 text-center font-medium rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      เลือก
                    </Link>

                    {/* ================== */}
                    {/* (จบ) ฝั่งขวา: Action */}
                    {/* ================== */}
                    {/*  */}
                  </div>
                ),
              )
          }

          {/* ============================== */}
          {/* กรณีไม่มีข้อมูล (Empty State) */}
          {/* ============================== */}

          {
            //
            templateData.length === 0 && ( // ปรับตามใช้งานจริง
              //
              <div className="py-12 text-center text-gray-500">ไม่พบข้อมูล</div>
            )
          }

          {/* ============================== */}
          {/* (จบ) กรณีไม่มีข้อมูล (Empty State) */}
          {/* ============================== */}
          {/*  */}
        </div>

        {/* ========================================================= */}
        {/* (จบ) ส่วนแสดงผล: Stacked List (สำหรับข้อมูลที่มี Column ไม่เยอะ) */}
        {/* ========================================================= */}

        {/* =========================== */}
        {/* ส่วนแสดงผล: Data Table */}
        {/* =========================== */}

        <div className="w-full overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
          <table className="w-full text-left text-sm text-gray-600">
            {/*  */}
            {/* =================== */}
            {/* หัวตาราง (Head) */}
            {/* =================== */}

            <thead className="bg-gray-50 text-gray-800 border-b border-gray-200">
              {/* 
                -------- ปรับตามใช้งานจริง --------
              */}
              <tr>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">ชื่อรายการ</th>
                <th className="px-6 py-4 font-semibold text-right">จัดการ</th>
              </tr>
              {/* 
                --------------------------------
              */}
            </thead>

            {/* =================== */}
            {/* (จบ) หัวตาราง (Head) */}
            {/* =================== */}

            {/* ======================= */}
            {/* ข้อมูลในตาราง (Body) */}
            {/* ======================= */}

            <tbody className="divide-y divide-gray-100">
              {
                //
                templateData // ปรับตามใช้งานจริง
                  //
                  .map(
                    (
                      //
                      temp, // ปรับตามใช้งานจริง
                      //
                    ) => (
                      <tr
                        key={
                          //
                          temp.id // ปรับตามใช้งานจริง
                          //
                        }
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        {/*  */}
                        {/* =========== */}
                        {/* Column */}
                        {/* =========== */}

                        {/* คอลัมน์: ID */}
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          {
                            //
                            temp.id // ปรับตามใช้งานจริง
                              //
                              .slice(0, 8)
                          }
                          ...
                        </td>

                        {/* คอลัมน์: ชื่อรายการ */}
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {
                            //
                            temp.name // ปรับตามใช้งานจริง
                            //
                          }
                        </td>

                        {/* คอลัมน์: Action */}
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={
                              //
                              `/template/${temp.id}/server-query` // ปรับตามใช้งานจริง
                              //
                            }
                            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            เลือก
                          </Link>
                        </td>

                        {/* =========== */}
                        {/* (จบ) Column */}
                        {/* =========== */}
                        {/*  */}
                      </tr>
                    ),
                  )
              }
            </tbody>

            {/* ======================= */}
            {/* (จบ) ข้อมูลในตาราง (Body) */}
            {/* ======================= */}
            {/*  */}
          </table>

          {/* ============================== */}
          {/* กรณีไม่มีข้อมูล (Empty State) */}
          {/* ============================== */}

          {
            //
            templateData.length === 0 && ( // ปรับตามใช้งานจริง
              //
              <div className="py-12 text-center text-gray-500">ไม่พบข้อมูล</div>
            )
          }

          {/* ============================== */}
          {/* (จบ) กรณีไม่มีข้อมูล (Empty State) */}
          {/* ============================== */}
          {/*  */}
        </div>

        {/* =========================== */}
        {/* (จบ) ส่วนแสดงผล: Data Table */}
        {/* =========================== */}

        {/* ===================== */}
        {/* ส่วนแสดงผล: Form */}
        {/* ===================== */}

        <MethodTemplateForm
          //
          // ปรับตามใช้งานจริง
          valueOne={"valueOne"}
          skipErrorCodes={[]}
          className=""
          //
        />

        {/* ===================== */}
        {/* (จบ) ส่วนแสดงผล: Form */}
        {/* ===================== */}

        {/* ========================= */}
        {/* ส่วนแสดงผล MENU CARD */}
        {/* ========================= */}

        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            เลือกเมนูที่ต้องการจัดการ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/*  */}
            {/* =================== */}
            {/* 🌟 รายการ Menu */}
            {/* =================== */}

            {/* =========== */}
            {/* เมนูที่ 1 */}
            {/* =========== */}

            <Link
              href={`/work-schedule/admin/${templateId}/position`}
              className="group relative flex flex-col bg-white border-2 border-transparent hover:border-purple-300 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* แถบสีตกแต่งด้านบน */}
              <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 group-hover:h-2 transition-all duration-300"></div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
                    จัดการตารางเวร
                  </h4>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    สร้างกะการทำงาน (Slots), อนุมัติการจองเวร,
                    และตรวจสอบตารางเวลาของพนักงานทั้งหมดในสถานที่นี้
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center text-purple-600 font-medium text-sm group-hover:translate-x-2 transition-transform">
                เปิดตำแหน่งงานและตารางเวร
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </Link>

            {/* =========== */}
            {/* (จบ) เมนูที่ 1 */}
            {/* =========== */}

            {/* =========== */}
            {/* เมนูที่ 2 */}
            {/* =========== */}

            <Link
              href={`/work-schedule/admin/${templateId}/staff`}
              className="group relative flex flex-col bg-white border-2 border-transparent hover:border-blue-300 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* แถบสีตกแต่งด้านบน */}
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 group-hover:h-2 transition-all duration-300"></div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                    จัดการพนักงาน
                  </h4>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                    เพิ่ม/ลบรายชื่อพนักงาน, จัดการตำแหน่ง (Positions)
                    และตั้งค่าสิทธิ์การเข้าถึงของบุคลากร
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-2 transition-transform">
                เปิดรายชื่อพนักงาน
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </Link>

            {/* =========== */}
            {/* (จบ) เมนูที่ 2 */}
            {/* =========== */}

            {/* =================== */}
            {/* 🌟 (จบ) รายการ Menu */}
            {/* =================== */}
            {/*  */}
          </div>
        </div>

        {/* ========================= */}
        {/* (จบ) ส่วนแสดงผล MENU CARD */}
        {/* ========================= */}

        {/* ============================= */}
        {/* ส่วนแสดงผล MENU CARD (2) */}
        {/* ============================= */}

        <div>
          {/* หัวข้อ Portal */}
          <div className="w-full max-w-5xl text-center mt-8">
            <h2 className="text-3xl font-bold text-gray-800">
              แอปพลิเคชันของคุณ
            </h2>
            <p className="text-gray-500 mt-2">
              เลือกโปรแกรมที่คุณต้องการใช้งานจาก Ecosystem
            </p>
          </div>

          {/* ตะแกรง Grid โชว์โปรแกรม 3 ตัว */}
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* โปรแกรมที่ 1: Toothcraft */}
            {/* ชั่วคราว: พาไปที่หน้า organizations ก่อน เพราะปกติต้องเลือกร้านก่อนเข้าแอป */}
            {/* <Link
            // ปรับตามใช้งานจริง
            href="/organizations"
            className="p-6 border rounded-2xl shadow-sm bg-white hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform font-bold text-3xl">
              🦷
            </div>
            <h3 className="text-lg font-bold text-gray-800">Toothcraft</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              ระบบบริหารจัดการคลินิกทันตกรรมครบวงจร
            </p>
            <button className="mt-auto px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg w-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
              เปิดใช้งาน
            </button>
          </Link> */}

            {/* 🌟 โปรแกรมที่ 2: Work Schedule System (ของจริง!) */}
            <Link
              href="/work-schedule"
              className="p-6 border border-purple-100 rounded-2xl shadow-sm bg-white hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* ป้ายกำกับ New */}
              <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                ใหม่
              </div>
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform font-bold text-3xl">
                🗓️
              </div>
              <h3 className="text-lg font-bold text-gray-800">Work Schedule</h3>
              <p className="text-sm text-gray-500 mt-2 mb-6">
                ระบบบริหารตารางการทำงานและจัดการกะ
              </p>
              <button className="mt-auto px-4 py-2 bg-purple-50 text-purple-600 font-medium rounded-lg w-full group-hover:bg-purple-600 group-hover:text-white transition-colors">
                เข้าสู่ระบบจัดเวร
              </button>
            </Link>

            {/* โปรแกรมที่ 3: Coming Soon */}
            <div className="p-6 border border-dashed border-gray-300 rounded-2xl bg-gray-50 flex flex-col items-center text-center opacity-70">
              <div className="w-16 h-16 bg-gray-200 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-600">Coming Soon</h3>
              <p className="text-sm text-gray-400 mt-2 mb-6">
                แอปพลิเคชันใหม่กำลังอยู่ในช่วงพัฒนา
              </p>
              <button
                disabled
                className="mt-auto px-4 py-2 bg-gray-200 text-gray-500 font-medium rounded-lg w-full cursor-not-allowed"
              >
                เร็วๆ นี้
              </button>
            </div>
          </div>
        </div>

        {/* ============================= */}
        {/* (จบ) ส่วนแสดงผล MENU CARD (2) */}
        {/* ============================= */}
        {/*  */}
      </div>

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
      {/*  */}
    </>
  );
}
