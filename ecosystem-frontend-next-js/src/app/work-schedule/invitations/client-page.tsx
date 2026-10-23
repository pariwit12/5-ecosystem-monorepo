"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { workScheduleStaffInvitationQueries } from "@/features/work-schedule/staff-invitation/work-schedule-staff-invitation.queries";
import { useStaffInvitationActions } from "@/features/work-schedule/staff-invitation/hooks/use-staff-invitation-actions";
import { DataStateWrapper } from "@/components/data-state-wrapper";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export default function Client() {
  const { getToken, userId, isLoaded } = useAuth();
  const { previewMutation, submitMutation } = useStaffInvitationActions();

  const [code, setCode] = useState("");
  const [previewData, setPreviewData] = useState<{
    invitationId: string;
    staffName: string;
    placeName: string;
    expiresAt: string;
  } | null>(null);

  const {
    data: mineData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery(
    workScheduleStaffInvitationQueries.mine(userId, getToken, [
      ErrorCode.PERSON_NOT_FOUND,
    ]),
  );

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      const res = await previewMutation.mutateAsync(code.trim());
      setPreviewData(res);
    } catch {
      // toast in hook
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    try {
      await submitMutation.mutateAsync(code.trim());
      setPreviewData(null);
      setCode("");
      void refetch();
    } catch {
      // toast in hook
    }
  };

  const invitations = mineData?.invitations || [];

  return (
    <DataStateWrapper
      isAuthLoaded={isLoaded}
      isQueryLoading={isLoading}
      errorQuery={error}
    >
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center gap-4 border-b pb-6">
          <Link
            href="/work-schedule"
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              ผูกบัญชีเข้าสู่สถานที่ทำงาน
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              กรอกรหัสคำเชิญ 24 ตัวอักษรที่ได้รับจากผู้ดูแลเพื่อเชื่อมบัญชี
            </p>
          </div>
        </header>

        {/* ฟอร์มกรอกโค้ด */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">
            กรอกรหัสคำเชิญ (Invitation Code)
          </h2>
          <form onSubmit={handlePreview} className="mt-4 flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              placeholder="กรอกรหัสคำเชิญ เช่น abcdefghijklmnopqrstuvwx"
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              maxLength={24}
              required
            />
            <button
              type="submit"
              disabled={previewMutation.isPending || code.length !== 24}
              className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {previewMutation.isPending ? "กำลังตรวจสอบ..." : "ตรวจสอบโค้ด"}
            </button>
          </form>

          {/* กล่อง Preview */}
          {previewData && (
            <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50/50 p-5">
              <h3 className="font-semibold text-purple-900">
                ข้อมูลการผูกบัญชีที่พบ
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-gray-500">ชื่อพนักงาน: </span>
                  <strong className="text-gray-800">{previewData.staffName}</strong>
                </div>
                <div>
                  <span className="text-gray-500">สถานที่ทำงาน: </span>
                  <strong className="text-gray-800">{previewData.placeName}</strong>
                </div>
                <div className="col-span-full">
                  <span className="text-gray-500">รหัสหมดอายุ: </span>
                  <span className="text-gray-700">
                    {new Date(previewData.expiresAt).toLocaleString("th-TH")}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3 border-t border-purple-200/60 pt-4">
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={submitMutation.isPending}
                  onClick={handleSubmit}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {submitMutation.isPending
                    ? "กำลังส่งคำขอ..."
                    : "ยืนยันส่งคำขอผูกบัญชี"}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ประวัติคำขอของฉัน */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                ประวัติคำขอผูกบัญชีของคุณ
              </h2>
              <p className="text-xs text-gray-500">
                คำขอที่ส่งไปยังผู้ดูแลของแต่ละสถานที่
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              {isFetching ? "กำลังโหลด..." : "รีเฟรช ⟳"}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {invitations.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                ยังไม่มีประวัติคำขอผูกบัญชี
              </p>
            ) : (
              invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {inv.staffName} — {inv.placeName}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ส่งคำขอเมื่อ:{" "}
                      {inv.requestedAt
                        ? new Date(inv.requestedAt).toLocaleString("th-TH")
                        : "-"}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        inv.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : inv.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : inv.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {inv.status === "APPROVED"
                        ? "อนุมัติแล้ว"
                        : inv.status === "PENDING"
                          ? "รอการอนุมัติ"
                          : inv.status === "REJECTED"
                            ? "ปฏิเสธแล้ว"
                            : inv.status === "EXPIRED"
                              ? "หมดอายุ"
                              : inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </DataStateWrapper>
  );
}
