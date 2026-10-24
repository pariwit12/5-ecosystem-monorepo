"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";

import { organizationsQueries } from "@/features/organizations/hooks/organizations.queries";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

import { useEffect } from "react"; // 🌟 1. นำเข้า useEffect
import { useRouter } from "next/navigation"; // 🌟 1. นำเข้า useRouter
import { isAxiosError } from "axios"; // 🌟 1. นำเข้า isAxiosError เพื่อความปลอดภัยของ TypeScript

import Link from "next/link";
import { ChevronRight, CheckCircle2 } from "lucide-react";

// Import Components ย่อย
import StepWelcome from "./_components/step-1-welcome";
import StepSetup from "./_components/step-2-setup";
import StepSuccess from "./_components/step-3-success";

// 🌟 รับ orgId ที่ผ่านการสแกนแล้วมาจาก Server Component
export default function NewDentalClinicClient({ orgId }: { orgId: string }) {
  const { getToken, userId, isLoaded } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // ดึงข้อมูลองค์กรมาเตรียมไว้ เผื่อเอาชื่อองค์กรไปเป็นค่า Default ให้ชื่อคลินิก
  const {
    data: orgDetails,
    isLoading,
    error,
  } = useQuery(
    organizationsQueries.detail(userId, orgId, getToken, [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
    ]),
  );

  const router = useRouter();

  // 🌟 3. ด่านดักจับ Error แล้ว Redirect
  useEffect(() => {
    // เช็คว่ามี Error และเป็น Error จาก Axios (บอก TS ให้ยอมให้เราดึง .response ได้)
    if (error && isAxiosError(error)) {
      const errorCode = error.response?.data?.errorCode;

      if ([ErrorCode.PERSON_NOT_FOUND].includes(errorCode)) {
        router.push(`/person/new?error=${errorCode}`);

        return;
      }

      if (
        [
          ErrorCode.ORGANIZATION_NOT_FOUND,
          ErrorCode.ORGANIZATION_DELETED,
          ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
        ].includes(errorCode)
      ) {
        router.push(`/organizations?error=${errorCode}`);
      }
    }
  }, [error, router]);

  const steps = ["ข้อมูลแพ็กเกจ", "ตั้งค่าคลินิก", "เสร็จสิ้น"];

  // isLoaded คือ จาก useAuth (Clerk) ป้องกันจังหวะแรกที่ยังโหลด userId ไม่เสร็จ
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // 🌟 4. ป้องกันหน้าจอกระพริบ (UI Flash):
  if (
    error &&
    isAxiosError(error) &&
    [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.ORGANIZATION_NOT_FOUND,
      ErrorCode.ORGANIZATION_DELETED,
      ErrorCode.NOT_A_MEMBER_OF_ORGANIZATION,
    ].includes(error.response?.data?.errorCode)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        เกิดข้อผิดพลาด กำลังพากลับไปยังหน้ารายชื่อองค์กร...
      </div>
    );
  }

  // Error อื่นๆ ยังไม่ได้จัดการ ให้ global-error-modal แสดงผล แต่หน้าจอยังไม่ได้จัดการต่อ

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        {/* 🟢 ส่วนหัวข้อ และปุ่มย้อนกลับ (ซ่อนเมื่อถึงหน้าสุดท้าย) */}
        {currentStep < 3 && (
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <Link
              href={`/organizations/${orgId}/dental-clinic`}
              className="p-2 bg-card border text-muted-foreground rounded-full hover:bg-muted transition shadow-sm"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                เปิดใช้งาน Dental Clinic Information System
              </h2>
              <p className="text-primary mt-1 text-sm font-medium">
                สิทธิ์ทดลองใช้งานฟรี 30 วัน (Free Trial)
              </p>
            </div>
          </div>
        )}

        {/* 🟢 Progress Stepper */}
        {currentStep < 3 && (
          <div className="flex items-center justify-center w-full max-w-xl mx-auto mb-4">
            {steps.map((label, index) => {
              const stepNum = index + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = stepNum < currentStep;

              return (
                <div key={label} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground ring-4 ring-primary"
                        : isCompleted
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={`ml-3 text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 md:w-16 h-1 mx-3 rounded-full transition-colors duration-300 ${isCompleted ? "bg-primary" : "bg-muted"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 🟢 โซน Render Component ตามสเต็ป */}
        <div className="w-full bg-card border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
          {currentStep === 1 && (
            <StepWelcome onNext={() => setCurrentStep(2)} />
          )}
          {currentStep === 2 && (
            <StepSetup
              defaultName={orgDetails?.name || ""}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && <StepSuccess orgId={orgId} />}
        </div>
      </div>
    </div>
  );
}
