import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils"; // ปรับ path ให้ตรงกับโปรเจกต์ของคุณ

export interface ChildrenHeaderProps {
  title: string;
  description: string;
  backHref: string;
  createHref: string;
  createLabel?: string;
  isFetching?: boolean;
  errorQuery?: boolean; // | any;
  refetch: () => void;
  dataUpdatedAt?: number;
  formatLastUpdate: (timestamp: number) => string;
}

export function ChildrenHeader({
  title,
  description,
  backHref,
  createHref,
  createLabel = "สร้างข้อมูลใหม่",
  isFetching = false,
  errorQuery,
  refetch,
  dataUpdatedAt = 0,
  formatLastUpdate,
}: {
  title: string;
  description: string;
  backHref: string;
  createHref: string;
  createLabel?: string;
  isFetching?: boolean;
  errorQuery?: boolean; // | any;
  refetch: () => void;
  dataUpdatedAt?: number;
  formatLastUpdate: (timestamp: number) => string;
}) {
  return (
    <div
      className={cn(
        "w-full",
        "max-w-7xl",
        "mx-auto",
        "flex",
        "flex-col",
        "gap-2 sm:gap-3",
        "relative",
        "px-4 sm:px-6",
        "py-4 sm:py-6",
      )}
    >
      <div>
        {/* 🟢 ปุ่มย้อนกลับ, ส่วนหัวข้อ และ ปุ่มสร้างข้อมูล */}
        <div
          className={cn(
            "flex",
            "flex-wrap",
            "items-center",
            "justify-between",
            "gap-2 sm:gap-3",
            "pb-4 sm:pb-4",
            "border-b",
          )}
        >
          {/* ปุ่มย้อนกลับ (ซ้ายสุด) */}
          <Link
            href={backHref}
            className={cn(
              "p-2",
              "rounded-full",
              "text-gray-600 bg-gray-100 hover:bg-gray-200 transition",
            )}
          >
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
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

          {/* ส่วนหัวข้อ */}
          <div className={cn("flex-1", "min-w-0", "gap-4 sm:gap-6")}>
            <h2
              className={cn(
                "text-2xl sm:text-3xl",
                "truncate",
                "font-bold",
                "text-gray-800",
              )}
            >
              {title}
            </h2>
            <p
              className={cn(
                "text-xs sm:text-sm",
                "truncate",
                "font-mono",
                "text-gray-500",
              )}
            >
              {description}
            </p>
          </div>

          {/* Create Button (ขวา) */}
          <Link
            href={createHref}
            className={cn(
              "p-2 sm:px-4 sm:py-2",
              "rounded-full sm:rounded-xl",
              "text-white",
              "bg-blue-500",
              "hover:bg-blue-700",
              "active:bg-blue-800",
              "shadow-sm",
              "transition-colors",
            )}
          >
            <svg
              className={cn("h-6 w-6", "sm:hidden")}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span
              className={cn(
                "hidden sm:block",
                "text-xs sm:text-sm",
                "truncate",
                "font-medium",
              )}
            >
              + {createLabel}
            </span>
          </Link>
        </div>

        {/* 🌟 แถบสถานะข้อมูล */}
        <div
          className={cn(
            "flex",
            "flex-wrap",
            "items-center",
            "justify-end",
            "h-6",
            "text-xs",
          )}
        >
          {isFetching ? (
            <span
              className={cn(
                "flex",
                "flex-wrap",
                "items-center",
                "gap-2",
                "text-gray-500 animate-pulse",
              )}
            >
              <svg
                className={cn("h-3.5 w-3.5", "animate-spin text-blue-500")}
                viewBox="0 0 24 24"
              >
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
          ) : errorQuery ? (
            <div className={cn("flex", "flex-wrap", "items-center", "gap-2")}>
              <span
                className={cn(
                  "flex",
                  "flex-wrap",
                  "items-center",
                  "gap-1.5",
                  "font-medium text-red-500",
                )}
              >
                <svg
                  className="h-3.5 w-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                อัปเดตล่าสุดไม่สำเร็จ
              </span>
              <button
                type="button"
                onClick={() => refetch()}
                className={cn(
                  "font-semibold underline",
                  "text-blue-600 hover:text-blue-700 transition-colors",
                  "cursor-pointer",
                )}
              >
                ลองใหม่
              </button>
            </div>
          ) : dataUpdatedAt > 0 ? (
            <div className={cn("flex", "flex-wrap", "items-center", "gap-3")}>
              <span
                className={cn(
                  "flex",
                  "flex-wrap",
                  "items-center",
                  "gap-1.5",
                  "text-gray-400",
                )}
              >
                <svg
                  className="h-3.5 w-3.5 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                อัปเดตล่าสุดเมื่อ: {formatLastUpdate(dataUpdatedAt)}
              </span>
              <button
                type="button"
                onClick={() => refetch()}
                className={cn(
                  "flex",
                  "flex-wrap",
                  "items-center",
                  "gap-1",
                  "font-medium text-gray-400 hover:text-gray-600 cursor-pointer transition-colors",
                )}
                title="กดเพื่ออัปเดตข้อมูลใหม่"
              >
                <svg
                  className="h-3.5 w-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17"
                  />
                </svg>
                รีเฟรช
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
