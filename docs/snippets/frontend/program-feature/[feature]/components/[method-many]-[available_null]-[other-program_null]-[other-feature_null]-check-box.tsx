"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ==>>==>>== Import Function (useHooks) ==<<==<<==

import {
  // ปรับตามใช้งานจริง
  useMethodManyAvailableOtherProgramOtherFeature,

  // ปรับตามใช้งานจริง
} from "../hooks/use-[method-many]-[available_null]-[other-program_null]-[other-feature_null]";

// ==>>==>>== (จบ) Import Function (useHooks) ==<<==<<==

// ปรับตามใช้งานจริง
export const MethodManyAvailableOtherProgramOtherFeatureCheckBox = ({
  //
  // ปรับตามใช้งานจริง
  // eslint-disable-next-line
  positionId,

  // ปรับตามใช้งานจริง
  // ข้อมูลสำหรับแสดงใน Stacked List
  staffs,

  // eslint-disable-next-line
  urlOnSuccess,
  // eslint-disable-next-line
  urlOnCancel,

  skipErrorCodes,
}: {
  // ปรับตามใช้งานจริง
  positionId: string;

  // ปรับตามใช้งานจริง
  // ข้อมูลสำหรับแสดงใน Stacked List
  staffs: {
    id: string;
    name: string;
  }[];

  urlOnSuccess: string;
  urlOnCancel: string;

  skipErrorCodes?: readonly string[];
}) => {
  const router = useRouter();

  // ปรับตามใช้งานจริง
  // State สำหรับเก็บ item ที่ถูกเลือก
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    // ปรับตามใช้งานจริง
    mutate: mutateMethodManyAvailableOtherProgramOtherFeature,
    isPending,

    // ปรับตามใช้งานจริง
  } = useMethodManyAvailableOtherProgramOtherFeature();

  // ==>>==>>== Function: เลือก / ยกเลิก ทุกรายการ ==<<==<<==

  const handleSelectAll = () => {
    if (
      // ปรับตามใช้งานจริง
      selectedIds.length === staffs.length
    ) {
      // ปรับตามใช้งานจริง
      // ถ้าเลือกครบแล้ว ให้เคลียร์ทิ้ง
      setSelectedIds([]);
    } else {
      // ปรับตามใช้งานจริง
      // ถ้ายังไม่ครบ ให้เลือกทั้งหมด
      setSelectedIds(staffs.map((staff) => staff.id));
    }
  };

  // ==>>==>>== (จบ) Function: เลือก / ยกเลิก ทุกรายการ ==<<==<<==

  // ==>>==>>== Function: เลือก / ยกเลิก ทีละรายการ ==<<==<<==

  const handleToggleSelect = (id: string) => {
    setSelectedIds(
      (prev) =>
        prev.includes(id)
          ? prev.filter((item) => item !== id) // เอาออก
          : [...prev, id], // เพิ่มเข้า
    );
  };

  // ==>>==>>== (จบ) Function: เลือก / ยกเลิก ทีละรายการ ==<<==<<==

  // ==>>==>>== Function: Submit ==<<==<<==

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      toast.warning("กรุณาเลือกอย่างน้อย 1 รายการ");
      return;
    }

    // ปรับตามใช้งานจริง
    mutateMethodManyAvailableOtherProgramOtherFeature(
      {
        // ปรับตามใช้งานจริง
        valueOne: "",

        valueTwo: "two",
        valueThree: "three",
        slots: [
          {
            name: "",
            actual_start_time: "1",
            actual_end_time: "2",
          },
          {
            name: "2",
            actual_start_time: "12:40",
            actual_end_time: "8",
          },
        ],

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

  // ==>>==>>== (จบ) Function: Submit ==<<==<<==

  return (
    <div className="space-y-4">
      {/* ================== */}
      {/* ส่วนควบคุม (ปุ่ม Select All / Submit) */}
      {/* ================== */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedIds.length === staffs.length && staffs.length > 0}
            onChange={handleSelectAll}
            className="w-5 h-5 cursor-pointer rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            เลือกทั้งหมด ({selectedIds.length}/{staffs.length})
          </span>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || selectedIds.length === 0}
          className={`px-6 py-2 text-center text-sm font-medium rounded-lg transition-colors
            ${
              isPending || selectedIds.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }
          `}
        >
          {isPending ? "กำลังทำงาน..." : "สร้าง Staff Position"}
        </button>
      </div>

      {/* ================== */}
      {/* ส่วนแสดงรายการ (Stacked List) */}
      {/* ================== */}
      <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
        {staffs.map((staff) => (
          <li key={staff.id} className="flex items-center p-4 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedIds.includes(staff.id)}
              onChange={() => handleToggleSelect(staff.id)}
              className="w-5 h-5 mr-4 cursor-pointer rounded border-gray-300"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{staff.name}</p>
              <p className="text-sm text-gray-500">ID: {staff.id}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
