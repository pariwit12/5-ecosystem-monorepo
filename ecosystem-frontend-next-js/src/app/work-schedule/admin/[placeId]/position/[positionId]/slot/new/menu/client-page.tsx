// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

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
} from "@/components/menu-grid/icon";

// ==========================================
// 🖥️ Component หลัก
// ==========================================

export default function WorkScheduleAdminPositionSlotNewMenuClient({
  placeId,
  positionId,
}: {
  placeId: string;
  positionId: string;
}) {
  return (
    <>
      <div
        className={cn(
          "@container",

          "w-full",

          "max-w-7xl",

          "mx-auto",

          "flex",
          "flex-col",
          "gap-2 sm:gap-3",

          "relative",

          "px-4 sm:px-6",

          "py-4 sm:py-6",
        )}
      >
        {/* ============================== */}
        {/* ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

        <ChildrenHeader
          //
          title={`เลือกวิธีสร้าง slot`}
          description={`เลือกเมนูที่ต้องการจัดการหรือเข้าถึง`}
          backHref={`/work-schedule/admin/${placeId}/position/${positionId}/slot`}
          //
        />

        {/* ============================== */}
        {/* (จบ) ส่วนหัวข้อ + สถานะ fetching */}
        {/* ============================== */}

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
            href={`/work-schedule/admin/${placeId}/position/${positionId}/slot/new/pre-fill`}
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

          {/* ========================= */}
          {/* (จบ) เมนู: สีมาตรฐาน */}
          {/* ========================= */}
          {/*  */}
        </MenuGrid>

        {/* ==================================== */}
        {/* 🌟 (จบ) โซนเมนูการทำงาน (การ์ด - Grid) */}
        {/* ==================================== */}
        {/*  */}
      </div>
    </>
  );
}
