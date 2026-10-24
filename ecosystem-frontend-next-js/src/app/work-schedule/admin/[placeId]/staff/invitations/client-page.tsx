"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { workScheduleStaffInvitationQueries } from "@/features/work-schedule/staff-invitation/work-schedule-staff-invitation.queries";
import { useStaffInvitationActions } from "@/features/work-schedule/staff-invitation/hooks/use-staff-invitation-actions";
import { DataStateWrapper } from "@/components/data-state-wrapper";
import { ErrorCode } from "@backend/common/exceptions/error-codes.enum";

export default function Client({ placeId }: { placeId: string }) {
  const { getToken, userId, isLoaded } = useAuth();
  const { decideMutation } = useStaffInvitationActions(placeId);

  const [confirmAction, setConfirmAction] = useState<{
    invitationId: string;
    decision: "APPROVE" | "REJECT";
    staffName: string;
    requesterName: string;
  } | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery(
    workScheduleStaffInvitationQueries.byPlace(userId, getToken, placeId, [
      ErrorCode.PERSON_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_NOT_FOUND,
      ErrorCode.WORK_SCHEDULE_PLACE_DELETED,
      ErrorCode.NOT_AN_ADMIN_OF_WORK_SCHEDULE_PLACE,
    ]),
  );

  const invitations = data?.invitations || [];

  const handleConfirmDecision = async () => {
    if (!confirmAction) return;
    try {
      await decideMutation.mutateAsync({
        invitationId: confirmAction.invitationId,
        decision: confirmAction.decision,
      });
      setConfirmAction(null);
    } catch {
      // toast in hook
    }
  };

  return (
    <DataStateWrapper
      isAuthLoaded={isLoaded}
      isQueryLoading={isLoading}
      errorQuery={error}
    >
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-wrap items-start gap-3 border-b pb-6 sm:items-center sm:gap-4">
          <Link
            href={`/work-schedule/admin/${placeId}/staff`}
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
              จัดการคำขอผูกบัญชีพนักงาน
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ตรวจสอบชื่อพนักงานและชื่อบัญชีของผู้ขอ ก่อนทำการอนุมัติ
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background transition"
            >
              {isFetching ? "กำลังโหลด..." : "รีเฟรช ⟳"}
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            {invitations.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                ไม่มีรายการคำเชิญหรือคำขอผูกบัญชีในสถานที่นี้
              </p>
            ) : (
              invitations.map((inv) => {
                const requesterFullName = inv.requester
                  ? [
                      inv.requester.firstName,
                      inv.requester.lastName,
                      inv.requester.nickname ? `(${inv.requester.nickname})` : null,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  : "ยังไม่มีผู้ส่งคำขอ";

                return (
                  <div
                    key={inv.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-muted/70 p-5 sm:flex-row sm:items-center"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {inv.staffName}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            inv.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : inv.status === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : inv.status === "REJECTED"
                                  ? "bg-destructive/10 text-destructive"
                                  : inv.status === "EXPIRED"
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-primary/10 text-primary"
                          }`}
                        >
                          {inv.status === "APPROVED"
                            ? "อนุมัติแล้ว"
                            : inv.status === "PENDING"
                              ? "รออนุมัติ"
                              : inv.status === "REJECTED"
                                ? "ปฏิเสธแล้ว"
                                : inv.status === "EXPIRED"
                                  ? "หมดอายุ"
                                  : inv.status === "ISSUED"
                                    ? "ออกรหัสแล้ว"
                                    : inv.status}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-muted-foreground">
                        <span>ผู้ส่งคำขอ: </span>
                        <strong className="text-foreground">
                          {requesterFullName}
                        </strong>
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        หมดอายุ:{" "}
                        {new Date(inv.expiresAt).toLocaleString("th-TH")}
                        {inv.requestedAt && (
                          <span className="ml-3">
                            ขอเมื่อ:{" "}
                            {new Date(inv.requestedAt).toLocaleString("th-TH")}
                          </span>
                        )}
                      </div>
                    </div>

                    {inv.status === "PENDING" && (
                      <div className="flex shrink-0 items-center gap-2 border-t pt-3 sm:border-t-0 sm:pt-0">
                        <button
                          type="button"
                          disabled={decideMutation.isPending}
                          onClick={() =>
                            setConfirmAction({
                              invitationId: inv.id,
                              decision: "REJECT",
                              staffName: inv.staffName,
                              requesterName: requesterFullName,
                            })
                          }
                          className="min-h-11 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 transition"
                        >
                          ปฏิเสธ
                        </button>
                        <button
                          type="button"
                          disabled={decideMutation.isPending}
                          onClick={() =>
                            setConfirmAction({
                              invitationId: inv.id,
                              decision: "APPROVE",
                              staffName: inv.staffName,
                              requesterName: requesterFullName,
                            })
                          }
                          className="min-h-11 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
                        >
                          อนุมัติ
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Dialog ยืนยันการอนุมัติ / ปฏิเสธ */}
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md min-w-0 overflow-y-auto rounded-2xl bg-card p-4 shadow-xl sm:p-6">
              <h3 className="text-lg font-bold text-foreground">
                {confirmAction.decision === "APPROVE"
                  ? "ยืนยันการอนุมัติผูกบัญชี"
                  : "ยืนยันการปฏิเสธคำขอ"}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                คุณกำลังจะ
                <span
                  className={
                    confirmAction.decision === "APPROVE"
                      ? "font-bold text-green-700"
                      : "font-bold text-destructive"
                  }
                >
                  {confirmAction.decision === "APPROVE" ? " อนุมัติ " : " ปฏิเสธ "}
                </span>
                การเชื่อมต่อระหว่าง:
              </p>
              <div className="mt-3 rounded-xl bg-background p-3 text-sm">
                <div>
                  พนักงาน: <strong>{confirmAction.staffName}</strong>
                </div>
                <div className="mt-1">
                  ผู้ขอ: <strong>{confirmAction.requesterName}</strong>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="min-h-11 w-full rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted sm:w-auto"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={decideMutation.isPending}
                  onClick={handleConfirmDecision}
                  className={`min-h-11 w-full rounded-xl px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition sm:w-auto ${
                    confirmAction.decision === "APPROVE"
                      ? "bg-primary hover:bg-primary/90"
                      : "bg-destructive hover:bg-destructive"
                  }`}
                >
                  {decideMutation.isPending
                    ? "กำลังดำเนินการ..."
                    : confirmAction.decision === "APPROVE"
                      ? "ยืนยันอนุมัติ"
                      : "ยืนยันปฏิเสธ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DataStateWrapper>
  );
}
