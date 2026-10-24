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
        <header className="flex flex-wrap items-start gap-3 border-b pb-6 sm:items-center sm:gap-4">
          <Link
            href="/work-schedule"
            className="min-h-11 min-w-11 p-2 bg-muted text-muted-foreground rounded-full hover:bg-muted transition"
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
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              ผูกบัญชีเข้าสู่สถานที่ทำงาน
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              กรอกรหัสคำเชิญ 24 ตัวอักษรที่ได้รับจากผู้ดูแลเพื่อเชื่อมบัญชี
            </p>
          </div>
        </header>

        {/* ฟอร์มกรอกโค้ด */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">
            กรอกรหัสคำเชิญ (Invitation Code)
          </h2>
          <form onSubmit={handlePreview} className="mt-4 flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              placeholder="กรอกรหัสคำเชิญ เช่น abcdefghijklmnopqrstuvwx"
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-mono focus:border-ring focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={24}
              required
            />
            <button
              type="submit"
              disabled={previewMutation.isPending || code.length !== 24}
              className="min-h-11 w-full rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
            >
              {previewMutation.isPending ? "กำลังตรวจสอบ..." : "ตรวจสอบโค้ด"}
            </button>
          </form>

          {/* กล่อง Preview */}
          {previewData && (
            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/10 p-5">
              <h3 className="font-semibold text-primary">
                ข้อมูลการผูกบัญชีที่พบ
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">ชื่อพนักงาน: </span>
                  <strong className="text-foreground">{previewData.staffName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">สถานที่ทำงาน: </span>
                  <strong className="text-foreground">{previewData.placeName}</strong>
                </div>
                <div className="col-span-full">
                  <span className="text-muted-foreground">รหัสหมดอายุ: </span>
                  <span className="text-foreground">
                    {new Date(previewData.expiresAt).toLocaleString("th-TH")}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row border-t border-primary/20 pt-4">
                <button
                  type="button"
                  onClick={() => setPreviewData(null)}
                  className="min-h-11 w-full rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted sm:w-auto"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={submitMutation.isPending}
                  onClick={handleSubmit}
                  className="min-h-11 w-full rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
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
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 border-b pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                ประวัติคำขอผูกบัญชีของคุณ
              </h2>
              <p className="text-xs text-muted-foreground">
                คำขอที่ส่งไปยังผู้ดูแลของแต่ละสถานที่
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex min-h-11 items-center text-xs font-medium text-primary hover:underline"
            >
              {isFetching ? "กำลังโหลด..." : "รีเฟรช ⟳"}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {invitations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                ยังไม่มีประวัติคำขอผูกบัญชี
              </p>
            ) : (
              invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {inv.staffName} — {inv.placeName}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-foreground"
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
