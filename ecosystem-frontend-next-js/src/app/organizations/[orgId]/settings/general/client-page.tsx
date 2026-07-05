"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { organizationsQueries } from "@/features/organizations/hooks/organizations.queries";

import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { useUpdateOrganizationById } from "@/features/organizations/hooks/use-update-organization-by-id";
import { UpdateOrganizationByIdDtoBody } from "@/features/organizations/api/update-organization-by-id.api";
import { UpdateOrganizationByIdDtoBodySchema } from "@backend/modules/organizations/commands/update-organization-by-id.command";

// 🌟 1. ดึงมาเฉพาะฟิลด์ที่ให้ User พิมพ์ในฟอร์ม
const organizationsSettingsGeneralFormSchema =
  UpdateOrganizationByIdDtoBodySchema.pick({
    name: true,
  });

// 2. เสก Type ให้ฟอร์ม
type OrganizationsSettingsGeneralForm = z.infer<
  typeof organizationsSettingsGeneralFormSchema
>;

export default function OrganizationGeneralClient({
  orgId,
}: {
  orgId: string;
}) {
  const { getToken, userId, isLoaded } = useAuth();
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

  // 🌟 3. ดักจับ Error และสั่งเตะออก (Redirect)
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

  // 🌟 3. ตั้งค่า React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OrganizationsSettingsGeneralForm>({
    resolver: zodResolver(organizationsSettingsGeneralFormSchema),
    values: { name: orgDetails?.name || "" }, // ค่าเริ่มต้นว่างๆ ไปก่อน
  });

  const updateMutation = useUpdateOrganizationById(orgId);

  // ฟังก์ชันจำลองการกด Save (เดี๋ยวเราค่อยมาเชื่อม API จริงทีหลัง)
  const onSubmit = async (values: OrganizationsSettingsGeneralForm) => {
    // 💡 จุดประกอบร่างข้อมูล ของ useMutation
    const finalPayload: UpdateOrganizationByIdDtoBody = {
      name: values.name, // จากฟอร์ม
      // source: "WEB_APPLICATION", // แอบแนบไปเอง (หรือจะดึงจาก Zustand ก็ได้)
    };

    return toast.promise(updateMutation.mutateAsync(finalPayload), {
      // ⏳ 1. สถานะจังหวะแรกที่กดปุ่มยิง API
      loading: "กำลังบันทึกข้อมูล...",
      success: () => {
        // ล้างค่าในฟอร์มเมื่อสำเร็จ
        // 🌟 ใช้ reset(values) เพื่อเอาชื่อใหม่ไปตั้งเป็นค่าตั้งต้น ทำให้ปุ่ม Save กลับไปกดไม่ได้ (isDirty = false)
        reset(values);

        // 🌟 2. สั่งเตะกลับไปหน้า Settings รวม
        // (ผู้ใช้จะเห็นหน้าใหม่ พร้อมๆ กับกล่อง Toast สีเขียวลอยขึ้นมาพอดีครับ!)
        router.push(`/organizations/${orgId}/settings`);

        return "อัปเดตข้อมูลองค์กรเรียบร้อย"; // ข้อความที่จะโชว์บนกล่อง Toast สีเขียว
      },
      // 🚨 3. สถานะเมื่อ API พัง หรือมี Error หลุดออกมา
      error: (error) => {
        // เนื่องจากเรามี Global Error Modal ในสถาปัตยกรรมหลักคอยดักดึงข้อมูลให้อยู่แล้ว
        // ตรงนี้เราส่งข้อความสั้นๆ ให้ตัว Toast ขึ้นกล่องสีแดงเตือนผู้ใช้ก็พอครับ
        return error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
      },
    });
  };

  // isLoaded คือ จาก useAuth (Clerk) ป้องกันจังหวะแรกที่ยังโหลด userId ไม่เสร็จ
  if (!isLoaded || isLoading) {
    return <div className="p-8 text-gray-500">กำลังโหลดข้อมูล...</div>;
  }

  // 🌟 4. กันหน้าจอกระพริบระหว่างเตะออก
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
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        เกิดข้อผิดพลาด กำลังพากลับไปยังหน้ารายชื่อองค์กร...
      </div>
    );
  }

  // Error อื่นๆ ยังไม่ได้จัดการ ให้ global-error-modal แสดงผล แต่หน้าจอยังไม่ได้จัดการต่อ

  return (
    <div className="p-8 w-full max-w-4xl mx-auto flex flex-col gap-8">
      {/* 🟢 ส่วนหัวข้อ และปุ่มย้อนกลับ */}
      <div className="flex items-center gap-4 border-b pb-6">
        <Link
          href={`/organizations/${orgId}/settings`}
          className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
        >
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-gray-800">ข้อมูลทั่วไป</h2>
          <p className="text-gray-500 mt-1 text-sm">
            จัดการชื่อและรายละเอียดพื้นฐานขององค์กร
          </p>
        </div>
      </div>

      {/* 🟢 โซนฟอร์มแก้ไขข้อมูล */}
      <div className="bg-white border rounded-2xl p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* ช่องกรอกชื่อ */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-bold text-gray-700">
              ชื่อองค์กร <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className={`p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
              }`}
              placeholder="ตัวอย่าง: คลินิกทันตกรรมฟันดี"
            />
            {errors.name && (
              <span className="text-sm text-red-500">
                {errors.name.message}
              </span>
            )}
          </div>

          {/* ปุ่มบันทึก */}
          <div className="flex justify-end border-t pt-6 mt-2">
            <button
              type="submit"
              // 🌟 ใช้ updateMutation.isPending แข็งแกร่งและตรงเป๊ะที่สุดครับ!
              disabled={
                !isDirty || updateMutation.isPending || updateMutation.isSuccess
              } // ปุ่มจะกดไม่ได้ถ้ายังไม่พิมพ์แก้ชื่อ (!isDirty) หรือกำลังสั่ง API อยู่ (isPending) และสำเร็จแล้วรอเปลี่ยนหน้า (isSuccess)
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending || updateMutation.isSuccess
                ? "กำลังบันทึก..."
                : "บันทึกการเปลี่ยนแปลง"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
