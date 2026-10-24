"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCreateMany } from "../hooks/use-create-many";

export const CreateManyCheckBox = ({
  positionId,

  staffs,

  // eslint-disable-next-line
  urlOnSuccess,
  // eslint-disable-next-line
  urlOnCancel,

  skipErrorCodes,
}: {
  positionId: string;

  staffs: {
    id: string;
    name: string;
  }[];

  urlOnSuccess: string;
  urlOnCancel: string;

  skipErrorCodes?: readonly string[];
}) => {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { mutate: mutateCreateMany, isPending } = useCreateMany();

  // ฟังก์ชันสำหรับเลือก / ยกเลิก ทุกรายการ
  const handleSelectAll = () => {
    if (selectedIds.length === staffs.length) {
      setSelectedIds([]); // ถ้าเลือกครบแล้ว ให้เคลียร์ทิ้ง
    } else {
      setSelectedIds(staffs.map((staff) => staff.id)); // ถ้ายังไม่ครบ ให้เลือกทั้งหมด
    }
  };

  // ฟังก์ชันสำหรับเลือก / ยกเลิก ทีละรายการ
  const handleToggleSelect = (id: string) => {
    setSelectedIds(
      (prev) =>
        prev.includes(id)
          ? prev.filter((item) => item !== id) // เอาออก
          : [...prev, id], // เพิ่มเข้า
    );
  };

  // ฟังก์ชันกด Submit
  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      toast.warning("กรุณาเลือกอย่างน้อย 1 รายการ");
      return;
    }

    mutateCreateMany(
      {
        positionId: positionId,

        staffIds: selectedIds,

        skipErrorCodes: skipErrorCodes,
      },
      {
        onSuccess: () => {
          toast.success(
            `ดำเนินการสร้าง Position สำเร็จ ${selectedIds.length} รายการ`,
          );
          setSelectedIds([]); // เคลียร์ Checkbox หลังทำสำเร็จ
          router.refresh();
        },
        onError: () => {
          toast.error("เกิดข้อผิดพลาดในการดำเนินการบางรายการ");
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* ================== */}
      {/* ส่วนควบคุม (ปุ่ม Select All / Submit) */}
      {/* ================== */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedIds.length === staffs.length && staffs.length > 0}
            onChange={handleSelectAll}
            className="w-5 h-5 cursor-pointer rounded border-border"
          />
          <span className="text-sm font-medium text-foreground">
            เลือกทั้งหมด ({selectedIds.length}/{staffs.length})
          </span>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || selectedIds.length === 0}
          className={`min-h-11 w-full px-6 py-2 text-center text-sm font-medium rounded-lg transition-colors sm:w-auto
            ${
              isPending || selectedIds.length === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }
          `}
        >
          {isPending ? "กำลังทำงาน..." : "สร้าง Staff Position"}
        </button>
      </div>

      {/* ================== */}
      {/* ส่วนแสดงรายการ (Stacked List) */}
      {/* ================== */}
      <ul className="divide-y divide-border bg-card rounded-lg shadow-sm">
        {staffs.map((staff) => (
          <li key={staff.id} className="flex items-center p-4 hover:bg-background">
            <input
              type="checkbox"
              checked={selectedIds.includes(staff.id)}
              onChange={() => handleToggleSelect(staff.id)}
              className="w-5 h-5 mr-4 cursor-pointer rounded border-border"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{staff.name}</p>
              <p className="text-sm text-muted-foreground">ID: {staff.id}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
