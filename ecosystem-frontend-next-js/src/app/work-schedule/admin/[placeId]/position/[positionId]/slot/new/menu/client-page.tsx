// ------------------------------------------------------------------------
// Pattern: Server Internal Only + CSR
// ------------------------------------------------------------------------

"use client";

import { cn } from "@/lib/utils";

import { ChildrenHeader } from "@/components/children-header";
import { MenuGrid } from "@/components/menu-grid/menu-gird";
import { MenuCard } from "@/components/menu-grid/menu-card";
import { PlusIcon } from "@/components/menu-grid/icon";

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
          <MenuCard
            //
            href={`/work-schedule/admin/${placeId}/position/${positionId}/slot/new/pre-fill`}
            icon={<PlusIcon />}
            title={`ใช้แบบร่าง`}
            description={`ใช้ข้อมูลแบบร่างที่เตรียมไว้แล้วมาช่วยในการสร้าง`}
            //
          />

          <MenuCard
            //
            href={`/work-schedule/admin/${placeId}/position/${positionId}/slot/new`}
            icon={<PlusIcon />}
            title={`ไม่ใช้แบบร่าง`}
            description={`ต้องการกำหนดรายละเอียดเอง โดยไม่ใช้แบบร่าง`}
            //
          />
        </MenuGrid>

        {/* ==================================== */}
        {/* 🌟 (จบ) โซนเมนูการทำงาน (การ์ด - Grid) */}
        {/* ==================================== */}
        {/*  */}
      </div>
    </>
  );
}
