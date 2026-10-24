"use client";

import { useState } from "react";
import { toast } from "sonner";

interface IssuedInvitationDialogProps {
  code: string | null;
  expiresAt: string | null;
  onClose: () => void;
}

export function IssuedInvitationDialog({
  code,
  expiresAt,
  onClose,
}: IssuedInvitationDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("คัดลอกรหัสคำเชิญแล้ว");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("ไม่สามารถคัดลอกได้โดยอัตโนมัติ กรุณาคัดลอกด้วยตนเอง");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md min-w-0 overflow-y-auto rounded-2xl bg-card p-4 shadow-xl sm:p-6">
        <h3 className="text-xl font-bold text-foreground">
          รหัสคำเชิญสำหรับผูกบัญชีพนักงาน
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          กรุณาส่งรหัสนี้ให้พนักงาน เพื่อนำไปกรอกในระบบ รหัสนี้จะแสดงเพียงครั้งเดียว
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-primary/20 bg-primary/10 p-4 text-center">
          <p className="break-all font-mono text-2xl font-bold tracking-wider text-primary select-all">
            {code}
          </p>
          {expiresAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              หมดอายุ: {new Date(expiresAt).toLocaleString("th-TH")}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="min-h-11 w-full rounded-xl border border-primary/20 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 sm:w-auto"
          >
            {copied ? "คัดลอกแล้ว ✓" : "คัดลอกรหัส"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
