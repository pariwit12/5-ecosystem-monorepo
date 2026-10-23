"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { workScheduleStaffQueries } from "@/features/work-schedule/staff/work-schedule-staff.queries";
import { DataStateWrapper } from "@/components/data-state-wrapper";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";
import { useStaffInvitationActions } from "@/features/work-schedule/staff-invitation/hooks/use-staff-invitation-actions";
import { IssuedInvitationDialog } from "@/features/work-schedule/staff-invitation/components/issued-invitation-dialog";

export default function Client({ placeId }: { placeId: string }) {
  const router = useRouter();
  const { getToken, userId, isLoaded } = useAuth();
  const { issueMutation, unlinkMutation } = useStaffInvitationActions(placeId);

  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [issuedExpiry, setIssuedExpiry] = useState<string | null>(null);
  const [unlinkConfirmStaff, setUnlinkConfirmStaff] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data, isLoading, isFetching, error } = useQuery(
    workScheduleStaffQueries.listsByPlaceId(userId, getToken, placeId, [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
    ]),
  );

  useEffect(() => {
    if (error && isAxiosError(error)) {
      const errorCode = error.response?.data?.errorCode;

      if ([ErrorCode.PERSON_NOT_FOUND].includes(errorCode)) {
        router.push(`/person/new?error=${errorCode}`);
        return;
      }

      if (
        [
          ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
          ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
          ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
        ].includes(errorCode)
      ) {
        router.push(`/work-schedule?error=${errorCode}`);
        return;
      }

      if (error && data !== undefined) {
        toast.error(
          "ไม่สามารถอัปเดตข้อมูลล่าสุดได้ แต่คุณยังคงดูข้อมูลเดิมได้อยู่",
        );
      }
    }
  }, [error, router, data]);

  if (
    error &&
    isAxiosError(error) &&
    [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
    ].includes(error.response?.data?.errorCode)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        เกิดข้อผิดพลาด กำลังพากลับไปยังหน้าแรกของ Work-Schedule...
      </div>
    );
  }

  const staffs = data?.workScheduleStaffs || [];

  const handleIssue = async (staffId: string) => {
    try {
      const res = await issueMutation.mutateAsync(staffId);
      setIssuedCode(res.code);
      setIssuedExpiry(res.expiresAt);
    } catch {
      // toast handled in hook
    }
  };

  const handleUnlink = async () => {
    if (!unlinkConfirmStaff) return;
    try {
      await unlinkMutation.mutateAsync(unlinkConfirmStaff.id);
      setUnlinkConfirmStaff(null);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <>
      <DataStateWrapper
        isAuthLoaded={isLoaded}
        isQueryLoading={isLoading}
        errorQuery={error}
      >
        <div className="p-8 w-full max-w-6xl mx-auto flex flex-col gap-8">
          <div className="flex items-center gap-4 border-b pb-6">
            <Link
              href={`/work-schedule/admin/${placeId}`}
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

            <div className="flex-1 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800">
                  รายชื่อพนักงาน
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                  จัดการข้อมูลพนักงานและการผูกบัญชีในระบบ
                </p>
                {isFetching && !isLoading && (
                  <span className="text-sm text-gray-400 flex items-center gap-2 mt-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    กำลังอัปเดตข้อมูล...
                  </span>
                )}
              </div>
              <div>
                <Link
                  href={`/work-schedule/admin/${placeId}/staff/invitations`}
                  className="rounded-xl border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 shadow-sm transition hover:bg-purple-100"
                >
                  จัดการคำขอผูกบัญชี 📋
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Link
              href={`/work-schedule/admin/${placeId}/staff/new`}
              className="group flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer min-h-40"
            >
              <div className="w-12 h-12 bg-white text-gray-400 rounded-full flex items-center justify-center shadow-sm group-hover:text-purple-600 group-hover:scale-110 transition-transform mb-3">
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
              <span className="font-medium text-gray-600 group-hover:text-purple-600">
                เพิ่มพนักงานใหม่
              </span>
            </Link>

            {staffs.map((staff) => (
              <div
                key={staff.id}
                className="border border-gray-200 bg-white rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      staff.isLinked
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {staff.isLinked ? "ผูกบัญชีแล้ว" : "ยังไม่ผูกบัญชี"}
                  </span>
                </div>

                <div className="overflow-hidden mb-4">
                  <h4
                    className="text-lg font-bold text-gray-800 truncate"
                    title={staff.name}
                  >
                    {staff.name}
                  </h4>
                  <p
                    className="text-xs text-gray-400 font-mono truncate"
                    title={staff.id}
                  >
                    ID: {staff.id.substring(0, 8)}...
                  </p>
                </div>

                <div className="mt-auto border-t pt-4 flex items-center justify-between gap-2">
                  {staff.isLinked ? (
                    <button
                      type="button"
                      disabled={unlinkMutation.isPending}
                      onClick={() =>
                        setUnlinkConfirmStaff({
                          id: staff.id,
                          name: staff.name,
                        })
                      }
                      className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      ถอดการผูก
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={issueMutation.isPending}
                      onClick={() => handleIssue(staff.id)}
                      className="text-xs font-medium text-purple-600 hover:text-purple-800 disabled:opacity-50"
                    >
                      ออกรหัสคำเชิญ
                    </button>
                  )}
                  <span className="text-xs text-gray-400">
                    {staff.isLinked ? "พร้อมใช้งาน" : "รอผูกบัญชี"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DataStateWrapper>

      {/* Dialog ออกรหัสคำเชิญ */}
      <IssuedInvitationDialog
        code={issuedCode}
        expiresAt={issuedExpiry}
        onClose={() => {
          setIssuedCode(null);
          setIssuedExpiry(null);
        }}
      />

      {/* Dialog ยืนยันยกเลิกการผูก */}
      {unlinkConfirmStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              ยืนยันการยกเลิกผูกบัญชี
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              คุณต้องการยกเลิกการผูกบัญชีของพนักงาน{" "}
              <strong className="text-gray-900">
                {unlinkConfirmStaff.name}
              </strong>{" "}
              ใช่หรือไม่?
            </p>
            <p className="mt-1 text-xs text-red-500">
              * ข้อมูลตารางเวรเดิมจะยังคงอยู่ แต่พนักงานจะไม่สามารถเข้าถึงสถานที่ทำงานนี้ได้จนกว่าจะผูกบัญชีใหม่
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUnlinkConfirmStaff(null)}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={unlinkMutation.isPending}
                onClick={handleUnlink}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {unlinkMutation.isPending ? "กำลังดำเนินการ..." : "ยืนยันยกเลิกผูก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
