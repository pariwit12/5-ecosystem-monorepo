// -----------------------------------------------------------
// UI Template
// -----------------------------------------------------------

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { USER_ERROR_MESSAGES } from "@/constants/error-messages";

import { cn } from "@/lib/utils";

import Link from "next/link";

import { ChildrenHeader } from "@/components/children-header";
import { MenuGrid } from "@/components/menu-grid/menu-gird";
import { MenuCard } from "@/components/menu-grid/menu-card";
import {
  CalendarIcon,
  PersonIcon,
  DetailNoteIcon,
  DocumentTextIcon,
  SettingIcon,
  PlusIcon,
} from "@/components/menu-grid/icon";

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

  const dataQuery = {
    name: "ชื่อ...",
  };

  const refetch = () => {
    return;
  };

  const isFetching = false;
  const errorQuery = undefined;
  const dataUpdatedAt = 123;

  const templateData: { id: string; name: string }[] = [
    {
      id: "UUID1",
      name: "test1-123456789-123456789-123456789-123456789-123456789",
    },
    { id: "UUID2", name: "test2" },
    { id: "UUID3", name: "test3" },
    { id: "UUID4", name: "test4" },
    // {
    //   id: "UUID5",
    //   name: "test5-123456789-123456789-123456789-123456789-123456789",
    // },
  ];
  const templateId = "123";

  const slotTemplate = {
    name: "prefillName",
    startTime: "20:00",
    durationMinute: 123,
  };

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

      <div
        className={cn(
          //
          // "@container",
          // @container: ให้ component นี้เป็น ref ของ cqw และ ของ @sm, @md, @lg เช่น 1cqw คือ 1% ของขนาดของ component นี้

          "w-full",
          "max-w-7xl",

          "mx-auto",

          "flex",
          "flex-col",
          "gap-2 sm:gap-3",

          "relative",

          "px-4 sm:px-6",
          "py-4 sm:py-6",
          //
        )}
      >
        {/*  */}
        {/* ============================== */}
        {/* ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

        <ChildrenHeader
          //
          title={
            //
            // ปรับตามใช้งานจริง

            `${dataQuery.name}`
            // `รายการ...`
            // `สร้าง...ใหม่`
          }
          description={
            //
            // ปรับตามใช้งานจริง

            // `เลือกเมนูที่ต้องการจัดการหรือเข้าถึง`
            `กรอกรายละเอียดและบันทึกเพื่อดำเนินการต่อ`
            // `จัดการและตรวจสอบข้อมูลรายการทั้งหมดในระบบ`
          }
          backHref={
            //
            `/template/${templateId}/server-query` // ปรับตามใช้งานจริง
            //
          }
          //

          // กรณี: ใช้ create button
          createHref={
            //
            `/template/${templateId}/server-query` // ปรับตามใช้งานจริง
            //
          }
          createLabel={
            //
            `สร้างข้อมูลใหม่ / สร้าง...ใหม่` // ปรับตามใช้งานจริง
            //
          }
          // (จบ) กรณี: ใช้ create button

          // กรณี: ใช้ status bar
          isFetching={isFetching}
          errorQuery={errorQuery}
          refetch={refetch}
          dataUpdatedAt={dataUpdatedAt}
          // (จบ) กรณี: ใช้ status bar
          //
        />

        {/* ============================== */}
        {/* (จบ) ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

        {/* ================================================== */}
        {/* 🌟 โซนเมนูการทำงาน + พื้นที่อันตราย (Danger Zone) */}
        {/* ================================================== */}

        {/* ==================================== */}
        {/* 🌟 โซนเมนูการทำงาน (การ์ด - Grid) */}
        {/* ==================================== */}

        <MenuGrid
          //
          title={`หากไม่ต้องการให้มีแถบ title ให้ลบออกได้เลย`} // ปรับตามใช้งานจริง
          minWidth={10} // ปรับตามใช้งานจริง
          //
        >
          {/* ==================================== */}
          {/* เมนู: สีหลัก (เน้น หรือ ใช้งานบ่อยสุด) */}
          {/* ==================================== */}

          <MenuCard
            //
            href={
              //
              `/template/${templateId}/target` // ปรับตามใช้งานจริง
              //
            }
            style="primary" // หากเป็น standard สามารถลบ style ออกได้เลย
            icon={
              //
              <CalendarIcon /> // ปรับตามใช้งานจริง
              //
            }
            title={
              //
              `ตารางคิว` // ปรับตามใช้งานจริง
              //
            }
            description={
              // สามารถลบ description ออกได้
              //
              `จัดการและตรวจสอบคิวงานของรายการนี้` // ปรับตามใช้งานจริง
              //
            }
            //
          />

          {/* ==================================== */}
          {/* (จบ) เมนู: สีหลัก (เน้น หรือ ใช้งานบ่อยสุด) */}
          {/* ==================================== */}

          {/* ========================= */}
          {/* เมนู: สีมาตรฐาน */}
          {/* ========================= */}

          <MenuCard
            href={`/`}
            icon={<PersonIcon />}
            title={`PersonIcon`}
            description={`ผู้ใช้, พนักงาน, ลูกค้า, ประชาชน`}
          />

          <MenuCard
            href={`/`}
            icon={<DetailNoteIcon />}
            title={`DetailNoteIcon`}
            description={`รายละเอียด, การจดบันทึก, จด Note`}
          />

          <MenuCard
            href={`/`}
            icon={<DocumentTextIcon />}
            title={`DocumentTextIcon`}
            description={`รายละเอียด, การจดบันทึก, จด Note`}
          />

          <MenuCard
            href={`/`}
            icon={<SettingIcon />}
            title={`SettingIcon`}
            description={`การตั้งค่า, การแก้ไขตั้งค่า, การแก้ไขรายละเอียด`}
          />

          <MenuCard
            href={`/`}
            icon={<PlusIcon />}
            title={`PlusIcon`}
            description={`การสร้างข้อมูลใหม่, การเพิ่มค่า`}
          />

          {/* ========================= */}
          {/* (จบ) เมนู: สีมาตรฐาน */}
          {/* ========================= */}
          {/*  */}
        </MenuGrid>

        {/* ==================================== */}
        {/* 🌟 (จบ) โซนเมนูการทำงาน (การ์ด - Grid) */}
        {/* ==================================== */}

        {/* 💡 สร้างพื้นที่ว่างคั่นกลาง (ดัน Danger Zone ให้ลงไปอยู่ล่างๆ) */}
        <div
          className={cn(
            //
            "mt-6 sm:mt-9",

            "border-t",
            "border-gray-100",
            //
          )}
        />

        {/* ================================================= */}
        {/* 🚨 พื้นที่อันตราย (Danger Zone): ลบรายการ / ข้อมูล */}
        {/* ================================================= */}

        <div
          className={cn(
            //
            "flex",
            "flex-col",

            "gap-2 sm:gap-3",
            //
          )}
        >
          <h3
            className={cn(
              //
              "text-lg",

              "font-bold text-red-600",

              "flex",
              "items-center",

              "gap-2",
              //
            )}
          >
            <svg
              className={cn(
                //
                "h-5 w-5",
                //
              )}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            เมนูสำหรับลบรายการ
          </h3>

          <div
            className={cn(
              //
              "border",
              "border-red-200",
              "bg-red-50",
              "rounded-2xl",

              "p-4",

              "flex",
              "flex-col sm:flex-row",
              "items-start sm:items-center",
              "justify-between",

              "gap-4",
              //
            )}
          >
            <div
              className={cn(
                //
                "flex-1",
                //
              )}
            >
              <h4
                className={cn(
                  //
                  "text-base font-bold text-gray-900",
                  //
                )}
              >
                ลบรายการนี้ออกจากระบบ
              </h4>
              <p
                className={cn(
                  //
                  "text-sm text-gray-600 mt-1",
                  //
                )}
              >
                เมื่อลบแล้ว
                ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้
                กรุณาตรวจสอบให้แน่ใจ
              </p>
            </div>

            {/* ================= */}
            {/* ปุ่ม ลบรายการนี้ */}
            {/* ================= */}

            <Link
              href={
                //
                `/template/${templateId}/delete-confirm` // Redirect ไปหน้ายืนยันการลบ
                //
              }
              className={cn(
                //
                "w-full sm:w-auto",

                "flex",
                "items-center",
                "justify-center",

                "rounded-xl",
                "px-5 py-2.5",
                "shrink-0",

                "font-medium",
                "text-white",
                "bg-red-600",
                "hover:bg-red-700",
                "active:bg-red-800",
                "shadow-sm transition-colors",
                //
              )}
            >
              <svg
                className={cn(
                  //
                  "h-4 w-4",

                  "mr-2",
                  //
                )}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              ลบรายการนี้
            </Link>

            {/* ================= */}
            {/* (จบ) ปุ่ม ลบรายการนี้ */}
            {/* ================= */}
            {/*  */}
          </div>
        </div>

        {/* ================================================= */}
        {/* 🚨 (จบ) พื้นที่อันตราย (Danger Zone): ลบรายการ / ข้อมูล */}
        {/* ================================================= */}

        {/* ================================================== */}
        {/* 🌟 (จบ) โซนเมนูการทำงาน + พื้นที่อันตราย (Danger Zone) */}
        {/* ================================================== */}

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
              <div className="py-6 text-sm text-center text-gray-500">
                ไม่พบข้อมูล
              </div>
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

        {/* ===================== */}
        {/* ส่วนแสดงผล: การ์ด */}
        {/* ===================== */}

        <div
          className={cn(
            //
            "grid",
            "grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))]",

            "gap-2 sm:gap-3",

            // grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))]: แปลว่าให้โปรแกรมจัดเองว่าจะแบ่งกี่ช่อง + ขนาดเท่าไหร่
            // auto-fill แปลว่า ถึงจะมีข้อมูลไม่ครบ ก็ให้ขนาดตามที่ควรจะเป็น
            // auto-fit แปลว่า ถ้าไม่มีข้อมูล โปรแกรมจะรวมช่องกลายเป็นช่องใหญ่ให้

            // minmax(x, 1fr): ให้ขนาดของการ์ด เล็กสุดคือ x, 1fr แปลว่าใช้พื้นที่เต็ม (ในแนวกว้าง)
            // minmax(250px, 1fr):
            // 250px (ความกว้างขั้นต่ำ): ถ้าย่อหน้าจอจนคอลัมน์แคบกว่า 250px มันจะปัดไอเทมตกไปอยู่บรรทัดใหม่ทันที
            // 1fr (ความกว้างสูงสุด): fr ย่อมาจาก fraction (สัดส่วน) หมายความว่า "ให้ใช้พื้นที่ที่เหลืออยู่ให้เต็ม" ถ้ามีพื้นที่เหลือ มันจะขยายขนาดคอลัมน์ให้กว้างขึ้นจนเต็มพื้นที่โดยอัตโนมัติ
            // min(100%,17rem) ใส่เพื่อให้เวลาหน้าจอเล็กกว่า 17rem แล้ว การ์ดไม่ทะลุไปด้านขวา

            // ฟังก์ชัน clamp(ค่าต่ำสุด, ค่าที่ต้องการให้ยืดหยุ่น, ค่าสูงสุด) จะรับค่า 3 ตัวครับ:
            // ค่าต่ำสุด (1rem หรือ 16px): บนจอมือถือ ช่องไฟจะไม่เล็กไปกว่านี้แล้ว
            // ค่าที่ต้องการให้ยืดหยุ่น (2vw): ตัวเลขนี้แหละคือพระเอก vw (Viewport Width) คือเปอร์เซ็นต์ความกว้างของหน้าจอ (2vw = 2% ของความกว้างจอ) พอหน้าจอขยายกว้างขึ้น ค่านี้จะใหญ่ขึ้นตาม ทำให้ช่องไฟค่อยๆ ถ่างออกอย่างนุ่มนวล
            // ค่าสูงสุด (2rem หรือ 32px): บนจอคอมพิวเตอร์ใหญ่ๆ ช่องไฟจะไม่กว้างไปกว่านี้แล้ว (ป้องกันไม่ให้การ์ดห่างกันจนดูขาดความเชื่อมโยง)

            // วิธีให้ระบบวัดจาก "ขนาดของ Component" แทนหน้าจอ
            // เพื่อให้แก้ปัญหาเรื่อง Sidebar เราจะเลิกใช้ vw แล้วเปลี่ยนไปใช้หน่วยที่ชื่อว่า cqw (Container Query Width) แทนครับ
            // vw = 1% ของหน้าจอเบราว์เซอร์
            // cqw = 1% ของ กล่องครอบ (Container) ที่มันอยู่
            //
          )}
        >
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
          placeTimezone=""
          prefillName={slotTemplate?.name}
          prefillStartTime={slotTemplate?.startTime}
          prefillDurationMinute={slotTemplate?.durationMinute}
          urlOnSuccess={`/template/${templateId}/success`}
          urlOnCancel={`/template/${templateId}/cancel`}
          skipErrorCodes={[]}
          className=""
          //
        />

        {/* ===================== */}
        {/* (จบ) ส่วนแสดงผล: Form */}
        {/* ===================== */}
        {/*  */}
      </div>

      {/* ========================================================================================== */}
      {/* (จบ) Main UI (children) */}
      {/* ========================================================================================== */}
      {/*  */}
    </>
  );
}

// อย่าลืมไปลงทะเบียน protected route ใน src/proxy.ts
