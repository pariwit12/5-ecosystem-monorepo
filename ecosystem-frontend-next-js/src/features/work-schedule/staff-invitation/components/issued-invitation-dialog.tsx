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
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-900">
          รหัสคำเชิญสำหรับผูกบัญชีพนักงาน
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          กรุณาส่งรหัสนี้ให้พนักงาน เพื่อนำไปกรอกในระบบ รหัสนี้จะแสดงเพียงครั้งเดียว
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-purple-300 bg-purple-50 p-4 text-center">
          <p className="font-mono text-2xl font-bold tracking-wider text-purple-700 select-all">
            {code}
          </p>
          {expiresAt && (
            <p className="mt-2 text-xs text-gray-500">
              หมดอายุ: {new Date(expiresAt).toLocaleString("th-TH")}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl border border-purple-600 px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition"
          >
            {copied ? "คัดลอกแล้ว ✓" : "คัดลอกรหัส"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
