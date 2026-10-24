"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { useCreateOrganization } from "../hooks/use-create-organization";
import { CreateOrganizationDtoBody } from "../api/create-organization.api";
import { CreateOrganizationDtoBodySchema } from "@backend/modules/organizations/commands/create-organization.command";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 🌟 1. ดึงมาเฉพาะฟิลด์ที่ให้ User พิมพ์ในฟอร์ม
const createOrganizationModalFormSchema = CreateOrganizationDtoBodySchema.pick({
  name: true,
  // ถ้ามีฟิลด์อื่นก็ใส่ true เพิ่มตรงนี้ได้เลย
});

// 2. เสก Type ให้ฟอร์ม
type CreateOrganizationModalForm = z.infer<
  typeof createOrganizationModalFormSchema
>;

export function CreateOrgModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const createMutation = useCreateOrganization();

  // ==========================================
  // 2. ตั้งค่า React Hook Form ควบรวมกับ Zod
  // ==========================================
  const form = useForm<CreateOrganizationModalForm>({
    resolver: zodResolver(createOrganizationModalFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // ==========================================
  // 3. ฟังก์ชัน Submit ที่ผ่านการกรองจาก Zod แล้ว + เป็นจุดประกอบร่าง (Transformation Point)
  // ==========================================
  const onSubmit = (values: CreateOrganizationModalForm) => {
    // 💡 จุดประกอบร่างข้อมูล ของ useMutation
    const finalPayload: CreateOrganizationDtoBody = {
      name: values.name, // จากฟอร์ม
      // source: "WEB_APPLICATION", // แอบแนบไปเอง (หรือจะดึงจาก Zustand ก็ได้)
    };

    toast.promise(createMutation.mutateAsync(finalPayload), {
      // ⏳ 1. สถานะจังหวะแรกที่กดปุ่มยิง API
      loading: "กำลังสร้างอค์กรของคุณ...",
      success: () => {
        setIsModalOpen(false);
        form.reset(); // ล้างค่าในฟอร์มเมื่อสำเร็จ
        return "สร้างองค์กรเรียบร้อย"; // ข้อความที่จะโชว์บนกล่อง Toast สีเขียว
      },
      // 🚨 3. สถานะเมื่อ API พัง หรือมี Error หลุดออกมา
      error: (error) => {
        // เนื่องจากเรามี Global Error Modal ในสถาปัตยกรรมหลักคอยดักดึงข้อมูลให้อยู่แล้ว
        // ตรงนี้เราส่งข้อความสั้นๆ ให้ตัว Toast ขึ้นกล่องสีแดงเตือนผู้ใช้ก็พอครับ
        return error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
      },
    });
  };

  return (
    <>
      {/* 🌟 1. ปุ่มทริกเกอร์ (แสดงเป็นรูปแบบการ์ดใน Grid) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="min-h-50 rounded-2xl border-2 border-dashed border-border bg-muted/50 p-5 text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary flex flex-col items-center justify-center group sm:p-6"
      >
        <div className="w-12 h-12 rounded-full bg-card border shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md min-w-0 overflow-y-auto rounded-2xl bg-card p-4 shadow-xl animate-in fade-in zoom-in duration-200 sm:p-6">
            <h3 className="text-xl font-bold text-foreground mb-2">
              สร้างองค์กรใหม่
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              กรุณาระบุชื่อคลินิกหรือองค์กรของคุณ
            </p>

            {/* 🌟 4. ใช้ native form คู่กับ handleSubmit ของ react-hook-form */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="orgName" className="text-foreground">
                  ชื่อองค์กร <span className="text-destructive">*</span>
                </Label>

                {/* 🌟 5. เชื่อม Input ของ shadcn เข้ากับระบบ Form */}
                <Input
                  id="orgName"
                  {...form.register("name")} // เวทมนตร์อยู่ตรงนี้ แทน onChange/value
                  disabled={createMutation.isPending}
                  placeholder="เช่น คลินิกทันตกรรมรอยยิ้ม"
                  className={`min-h-11 ${
                    form.formState.errors.name
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />

                {/* แสดง Error Message จาก Zod */}
                {form.formState.errors.name && (
                  <span className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
                {/* 🌟 6. เปลี่ยนมาใช้ Button ของ shadcn/ui */}
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 w-full sm:flex-1"
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
                  className="min-h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:flex-1"
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
