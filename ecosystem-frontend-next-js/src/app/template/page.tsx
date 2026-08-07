// -----------------------------------------------------------
// UI Template
// -----------------------------------------------------------

"use client";

import { useState, useMemo } from "react";

import { cn } from "@/lib/utils";
import { DateTime } from "luxon";

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
  MethodManyAvailableOtherProgramOtherFeatureForm,

  // ปรับตามใช้งานจริง
} from "@/features/[program]/[feature]/components/[method-many]-[available_null]-[other-program_null]-[other-feature_null]-form";
import { DateRangePicker } from "@/components/date-range-picker/date-range-picker";
import { DateTimeRangePicker } from "@/components/input/datetime-input";

// ===========================================
// ⏱️ ส่วนทดสอบ Loading: หน่วงเวลา 5 วินาที
// ===========================================

await new Promise((resolve) => setTimeout(resolve, 5000));

// ===========================================
// ⏱️ (จบ) ส่วนทดสอบ Loading: หน่วงเวลา 5 วินาที
// ===========================================

export default function Page() {
  //

  // const dataQuery = {
  //   name: "ชื่อ...",
  // };

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
  ];
  const templateId = "123";

  const slotTemplate = {
    name: "prefillName",
    startTime: "20:00",
    durationMinute: 123,
  };

  // สำหรับตารางแบบ Timeline View หรือ Gantt Chart View

  // 1. จำลองข้อมูลพนักงานและกะงานใน 1 วัน
  const scheduleData = [
    {
      employeeId: "1",
      name: "พนักงาน A",
      shifts: [
        {
          id: "s1",
          name: "เวรเช้า",
          start: "08:00",
          end: "16:00",
          color: "bg-blue-500",
        },
      ],
    },
    {
      employeeId: "2",
      name: "พนักงาน B",
      shifts: [
        {
          id: "s2",
          name: "เวรบ่าย",
          start: "12:00",
          end: "20:00",
          color: "bg-orange-500",
        },
      ],
    },
    {
      employeeId: "3",
      name: "พนักงาน C",
      shifts: [
        {
          id: "s3",
          name: "เวรดึก",
          start: "20:00",
          end: "04:00",
          color: "bg-purple-500",
          isOvernight: true,
        },
        {
          id: "s4",
          name: "โอทีเช้า",
          start: "08:00",
          end: "12:00",
          color: "bg-green-500",
        },
      ],
    },
  ];

  // 2. ฟังก์ชันแปลง "HH:mm" เป็น จำนวนนาทีรวม (0 - 1440)
  const timeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // 3. ฟังก์ชันคำนวณตำแหน่ง % บนหน้าจอ
  const getShiftStyle = (start: string, end: string, isOvernight = false) => {
    const startMins = timeToMinutes(start);
    let endMins = timeToMinutes(end);

    if (isOvernight) endMins += 24 * 60; // ถ้าข้ามวัน ให้บวกไปอีก 1440 นาที

    const totalMinutesInDay = 24 * 60;

    // ตำแหน่งจากซ้ายสุด
    const leftPercent = (startMins / totalMinutesInDay) * 100;
    // ความกว้างของกล่อง
    const widthPercent = ((endMins - startMins) / totalMinutesInDay) * 100;

    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
    };
  };

  // 4. สร้างแกนเวลา (Header) เช่น 00:00, 04:00, 08:00 ... 20:00
  const timeHeaders = Array.from(
    { length: 7 },
    (_, i) => `${String(i * 4).padStart(2, "0")}:00`,
  );

  // 1. จำลองข้อมูล (ใช้ ISO String แบบเดียวกับ Backend ของคุณ)
  const mockData = [
    {
      employeeId: "1",
      name: "หมอ A",
      shifts: [
        {
          id: "s1",
          name: "ตรวจปกติ",
          start: "2026-07-20T08:00:00",
          end: "2026-07-20T16:00:00",
          color: "bg-blue-500",
        },
        {
          id: "s2",
          name: "ตรวจปกติ",
          start: "2026-07-22T08:00:00",
          end: "2026-07-22T16:00:00",
          color: "bg-blue-500",
        },
      ],
    },
    {
      employeeId: "2",
      name: "ผู้ช่วย B",
      shifts: [
        {
          id: "s3",
          name: "เวรบ่าย",
          start: "2026-07-20T12:00:00",
          end: "2026-07-20T20:00:00",
          color: "bg-orange-500",
        },
        {
          id: "s4",
          name: "เวรดึก (ข้ามวัน)",
          start: "2026-07-21T20:00:00",
          end: "2026-07-22T04:00:00",
          color: "bg-purple-500",
        },
      ],
    },
  ];

  // const schedules = [
  //   {
  //     id: "123",
  //     startTime: "2026-01-01T08:00:00Z",
  //     endTime: "2026-01-01T18:00:00Z",
  //     min: 2,
  //     max: 5,
  //   },
  //   {
  //     id: "1234",
  //     startTime: "2026-01-01T08:00:00Z",
  //     endTime: "2026Z",
  //     min: 2,
  //     max: 5,
  //   },
  // ];

  const [startDateTime, setStartDateTime] = useState<string>("");
  const [endDateTime, setEndDateTime] = useState<string>("");

  // 🌟 State สำหรับเก็บช่วงวันที่เริ่มต้นและสิ้นสุด
  const [startDate, setStartDate] = useState<string>(
    DateTime.now().toFormat("yyyy-MM-dd"), // ค่าเริ่มต้น: วันนี้
  );
  const [endDate, setEndDate] = useState<string>(
    DateTime.now().plus({ days: 6 }).toFormat("yyyy-MM-dd"), // ค่าเริ่มต้น: +6 วัน (รวมเป็น 7 วัน)
  );

  // ==========================================
  // 🌟 Logic คำนวณช่วงเวลา (Memoized เพื่อประสิทธิภาพ)
  // ==========================================
  const { rangeStartDt, rangeEndDt, totalRangeMinutes, daysInHeader } =
    useMemo(() => {
      // กำหนดเวลาให้เริ่ม 00:00:00 และจบ 23:59:59 ของช่วงที่เลือก
      const start = DateTime.fromISO(startDate).startOf("day");
      const end = DateTime.fromISO(endDate).endOf("day");

      // หาจำนวนนาทีทั้งหมดในช่วงเวลานี้ (ตัวหารหลักของเรา)
      const totalMins = end.diff(start, "minutes").minutes;

      // สร้าง Array ของวันที่เพื่อใช้แสดงบน Header (เช่น 20, 21, 22...)
      const days = [];
      let current = start;
      while (current <= end) {
        days.push(current);
        current = current.plus({ days: 1 });
      }

      return {
        rangeStartDt: start,
        rangeEndDt: end,
        totalRangeMinutes: totalMins,
        daysInHeader: days,
      };
    }, [startDate, endDate]);

  // ==========================================
  // 🌟 Function คำนวณ % ตำแหน่งและความกว้าง
  // ==========================================
  const getShiftStyleVerTwo = (startIso: string, endIso: string) => {
    const shiftStart = DateTime.fromISO(startIso);
    const shiftEnd = DateTime.fromISO(endIso);

    // ถ้ากะงานอยู่นอกช่วงเวลาที่เรากำลังดู ให้ซ่อนไปเลย
    if (shiftEnd <= rangeStartDt || shiftStart >= rangeEndDt) {
      return { display: "none" };
    }

    // ตัดส่วนที่ล้นออก (เช่น กะเริ่มก่อนวันที่เราดู ให้เริ่มจากขอบซ้ายสุดพอดี)
    const clampedStart = DateTime.max(shiftStart, rangeStartDt);
    const clampedEnd = DateTime.min(shiftEnd, rangeEndDt);

    // หานาทีที่ห่างจากจุดเริ่มต้น และระยะเวลาของกะงาน
    const offsetMins = clampedStart.diff(rangeStartDt, "minutes").minutes;
    const durationMins = clampedEnd.diff(clampedStart, "minutes").minutes;

    return {
      left: `${(offsetMins / totalRangeMinutes) * 100}%`,
      width: `${(durationMins / totalRangeMinutes) * 100}%`,
    };
  };

  // ==================
  // ส่วนแสดงผล UI หลัก
  // ==================

  return (
    <>
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
          title={
            //
            // ปรับตามใช้งานจริง

            // `${dataQuery.name}`
            `รายการ...`
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
            // ปรับตามใช้งานจริง
            `/template/${templateId}/server-query`
          }
          //

          // กรณี: ใช้ create button
          createHref={
            // ปรับตามใช้งานจริง
            `/template/${templateId}/server-query`
          }
          createLabel={
            // ปรับตามใช้งานจริง
            `สร้างข้อมูลใหม่ / สร้าง...ใหม่`
          }
          // (จบ) กรณี: ใช้ create button

          // กรณี: ใช้ status bar
          isFetching={isFetching}
          errorQuery={errorQuery}
          refetch={refetch}
          dataUpdatedAt={dataUpdatedAt}
          // (จบ) กรณี: ใช้ status bar
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
              <div className="py-6 text-center text-gray-500">ไม่พบข้อมูล</div>
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

        <MethodManyAvailableOtherProgramOtherFeatureForm
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
        />

        {/* ===================== */}
        {/* (จบ) ส่วนแสดงผล: Form */}
        {/* ===================== */}

        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 🌟 Header: แถบแสดงเวลา */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <div className="shrink-0 p-4 font-bold text-gray-700 border-r border-gray-200">
              พนักงาน
            </div>
            <div className="flex-1 relative h-12">
              {/* วางตัวเลขเวลาตามตำแหน่ง % */}
              {timeHeaders.map((time, index) => (
                <div
                  key={time}
                  className="absolute top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 -translate-x-1/2"
                  style={{ left: `${((index * 4 * 60) / (24 * 60)) * 100}%` }}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>

          {/* 🌟 Body: รายชื่อพนักงาน และ กล่องเวลา (Shifts) */}
          <div className="flex flex-col">
            {scheduleData.map((emp) => (
              <div
                key={emp.employeeId}
                className="flex border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                {/* ซ้าย: ชื่อพนักงาน */}
                <div className="shrink-0 p-4 text-sm font-medium text-gray-800 border-r border-gray-200 bg-white">
                  {emp.name}
                </div>

                {/* ขวา: พื้นที่ Timeline ของคนๆ นั้น */}
                <div className="flex-1 relative min-h-15 py-2">
                  {/* ตีเส้นจางๆ เป็นไกด์ไลน์ (ทำหรือไม่ทำก็ได้ ตามที่คุณบอกว่าไม่อยากให้เป็นคอลัมน์ชัดๆ) */}
                  <div className="absolute inset-0 flex justify-between pointer-events-none px-0">
                    {timeHeaders.map((_, i) => (
                      <div key={i} className="h-full w-px bg-gray-100" />
                    ))}
                  </div>

                  {/* วาดกล่องกะงาน */}
                  {emp.shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className={`absolute top-2 bottom-2 rounded-lg shadow-sm text-white text-xs px-2 py-1 flex items-center overflow-hidden truncate transition-transform hover:scale-[1.02] cursor-pointer ${shift.color}`}
                      style={getShiftStyle(
                        shift.start,
                        shift.end,
                        shift.isOvernight,
                      )}
                      title={`${shift.name} (${shift.start} - ${shift.end})`}
                    >
                      <span className="font-semibold truncate">
                        {shift.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DateTimeRangePicker
          startDateTime={startDateTime}
          endDateTime={endDateTime}
          onStartChange={setStartDateTime}
          onEndChange={setEndDateTime}
          isSubmitting={false}
        />

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {/* 🟢 พื้นที่ Timeline */}
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          {/* กำหนด min-w ให้กว้างพอสำหรับดูหลายๆ วัน ถ้าจอมันแคบกว่านี้มันจะเกิด Scroll Bar แนวนอน */}
          <div className="lg:min-w-full flex flex-col">
            {/* Header: แถบแสดงวันที่ */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <div className="shrink-0 p-4 font-bold text-gray-700 border-r border-gray-200">
                พนักงาน
              </div>
              <div className="flex-1 relative flex">
                {/* แบ่งความกว้างตามจำนวนวันเท่าๆ กัน */}
                {daysInHeader.map((date) => (
                  <div
                    key={date.toISO()}
                    className="flex-1 border-r border-gray-200 last:border-r-0 p-2 text-center text-sm font-semibold text-gray-600"
                  >
                    {date.toFormat("dd MMM")}
                  </div>
                ))}
              </div>
            </div>

            {/* Body: รายชื่อพนักงาน และ กล่องเวลา */}
            {mockData.map((emp) => (
              <div
                key={emp.employeeId}
                className="flex border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors"
              >
                {/* ชื่อพนักงาน */}
                <div className="shrink-0 p-4 text-sm font-medium text-gray-800 border-r border-gray-200 bg-white">
                  {emp.name}
                </div>

                {/* พื้นที่ Timeline */}
                <div className="flex-1 relative min-h-16">
                  {/* เส้นไกด์ไลน์แบ่งวัน (พื้นหลัง) */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {daysInHeader.map((date) => (
                      <div
                        key={`bg-${date.toISO()}`}
                        className="flex-1 border-r border-gray-100 last:border-r-0"
                      />
                    ))}
                  </div>

                  {/* วาดกล่องกะงาน */}
                  {emp.shifts.map((shift) => {
                    const style = getShiftStyleVerTwo(shift.start, shift.end);

                    // ถ้า display เป็น none ให้ข้ามการ render ไปเลย
                    if (style.display === "none") return null;

                    return (
                      <div
                        key={shift.id}
                        className={`absolute top-2 bottom-2 rounded-md shadow-sm text-white text-xs px-2 py-1 flex flex-col justify-center overflow-hidden transition-transform hover:scale-[1.02] hover:z-10 cursor-pointer ${shift.color}`}
                        style={style}
                        title={`${shift.name}\n${DateTime.fromISO(shift.start).toFormat("dd/MM HH:mm")} - ${DateTime.fromISO(shift.end).toFormat("dd/MM HH:mm")}`}
                      >
                        <span className="font-semibold truncate">
                          {shift.name}
                        </span>
                        <span className="text-[10px] opacity-80 truncate hidden sm:block">
                          {DateTime.fromISO(shift.start).toFormat("HH:mm")} -{" "}
                          {DateTime.fromISO(shift.end).toFormat("HH:mm")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
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
