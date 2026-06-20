"use client";

import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { isAxiosError } from "axios";

interface DataStateWrapperProps {
  isAuthLoaded?: boolean;
  isQueryLoading?: boolean;
  errorQuery?: unknown;
  //   accessDeniedCodes?: string[];
  //   redirectUrl?: string;
  children: React.ReactNode; // 🌟 This is the magic prop that holds the actual page UI
}

export const DataStateWrapper = ({
  isAuthLoaded = true,
  isQueryLoading = false,
  errorQuery,
  //   accessDeniedCodes = [],
  //   redirectUrl = "/",
  children,
}: DataStateWrapperProps) => {
  //   const router = useRouter();
  const [showReloadButton, setShowReloadButton] = useState(false);

  //   // 1. Error Handling & Redirects
  //   useEffect(() => {
  //     if (error && isAxiosError(error)) {
  //       const errorCode = error.response?.data?.errorCode;
  //       if (accessDeniedCodes.includes(errorCode)) {
  //         router.push(`${redirectUrl}?error=${errorCode}`);
  //       }
  //     }
  //   }, [error, router, accessDeniedCodes, redirectUrl]);

  // 2. The 5-Second Timer for Loading States
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReloadButton(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // 3. UI: Render the Loading Screen if Auth or Data isn't ready
  if (!isAuthLoaded || isQueryLoading) {
    const message = !isAuthLoaded
      ? "กำลังตรวจสอบสิทธิ์การเข้าถึง..."
      : "กำลังโหลดข้อมูล...";

    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[50vh] gap-4">
        <div className="text-gray-500 animate-pulse">{message}</div>

        {showReloadButton && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all flex items-center gap-2 shadow-sm border border-gray-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            โหลดหน้าเว็บใหม่อีกครั้ง
          </button>
        )}
      </div>
    );
  }

  if (errorQuery) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[50vh] gap-4">
        <div className="text-red-500 animate-pulse">เกิดข้อผิดพลาด...</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all flex items-center gap-2 shadow-sm border border-gray-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          โหลดหน้าเว็บใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  //   // 4. UI: Render the kicking-out message to prevent flashing
  //   if (
  //     error &&
  //     isAxiosError(error) &&
  //     accessDeniedCodes.includes(error.response?.data?.errorCode)
  //   ) {
  //     return (
  //       <div className="flex items-center justify-center min-h-[50vh] text-gray-500">
  //         เกิดข้อผิดพลาด redirecting...
  //       </div>
  //     );
  //   }

  // 5. SUCCESS! Render the actual page content.
  return <>{children}</>;
};
