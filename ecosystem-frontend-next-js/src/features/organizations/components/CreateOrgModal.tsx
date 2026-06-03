"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 🌟 นำเข้า Hook สำหรับสร้างองค์กรที่เราแยกไฟล์ไว้
import { useCreateOrganization } from "../hooks/useCreateOrganization";

// 🌟 Import UI Components จาก shadcn (ปรับ Path ให้ตรงกับโปรเจกต์นะครับ)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ==========================================
// 1. กำหนด Zod Schema (จำลอง) ค่อยปรับให้ดึงมาจาก validations.ts)
// ==========================================
const createOrgSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อองค์กรให้ครบถ้วน"),
});
type CreateOrgInput = z.infer<typeof createOrgSchema>;

export function CreateOrgModal() {
  // 🎯 State ทั้งหมดถูกขังไว้ในนี้ จะไม่กระทบหน้าจอหลักแล้ว
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createMutation = useCreateOrganization();

  // ==========================================
  // 2. ตั้งค่า React Hook Form ควบรวมกับ Zod
  // ==========================================
  const form = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: "",
    },
  });

  // ==========================================
  // 3. ฟังก์ชัน Submit ที่ผ่านการกรองจาก Zod แล้ว
  // ==========================================
  const onSubmit = (values: CreateOrgInput) => {
    // 💡 values.name ตรงนี้จะรับประกันว่าเป็น string แน่นอน ไม่ต้อง .trim() เองแล้ว
    createMutation.mutate(values.name, {
      onSuccess: () => {
        setIsModalOpen(false);
        form.reset(); // ล้างค่าในฟอร์มเมื่อสำเร็จ
      },
    });
  };

  return (
    <>
      {/* 🌟 1. ปุ่มทริกเกอร์ (แสดงเป็นรูปแบบการ์ดใน Grid) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all flex flex-col items-center justify-center text-gray-500 group min-h-[200px]"
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
        <span className="font-bold text-lg">สร้างองค์กรใหม่</span>
      </button>

      {/* 🌟 2. ตัวป๊อปอัป Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              สร้างองค์กรใหม่
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              กรุณาระบุชื่อคลินิกหรือองค์กรของคุณ
            </p>

            {/* 🌟 4. ใช้ native form คู่กับ handleSubmit ของ react-hook-form */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="orgName" className="text-gray-700">
                  ชื่อองค์กร <span className="text-red-500">*</span>
                </Label>

                {/* 🌟 5. เชื่อม Input ของ shadcn เข้ากับระบบ Form */}
                <Input
                  id="orgName"
                  {...form.register("name")} // เวทมนตร์อยู่ตรงนี้ แทน onChange/value
                  disabled={createMutation.isPending}
                  placeholder="เช่น คลินิกทันตกรรมรอยยิ้ม"
                  className={
                    form.formState.errors.name
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />

                {/* แสดง Error Message จาก Zod */}
                {form.formState.errors.name && (
                  <span className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                {/* 🌟 6. เปลี่ยนมาใช้ Button ของ shadcn/ui */}
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsModalOpen(false);
                    form.reset();
                  }}
                  disabled={createMutation.isPending}
                >
                  ยกเลิก
                </Button>

                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending
                    ? "กำลังสร้าง..."
                    : "ยืนยันการสร้าง"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
