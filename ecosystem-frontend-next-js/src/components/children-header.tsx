import Link from "next/link";
import { cn } from "@/lib/utils";

// Function แปลงเวลาไว้แสดงเวลา Update ล่าสุด
const formatLastUpdate = (timestamp: number) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export function ChildrenHeader({
  title,
  description,
  backHref,

  createHref,
  createLabel = "สร้างข้อมูลใหม่",

  isFetching,
  errorQuery,
  refetch,
  dataUpdatedAt,
}: {
  title: string;
  description: string;
  backHref: string;

  // กรณี: ใช้ create button
  createHref?: string;
  createLabel?: string;
  //

  // กรณี: ใช้ status bar
  isFetching?: boolean;
  errorQuery?: Error | null;
  refetch?: () => void;
  dataUpdatedAt?: number;
  //
}) {
  return (
    //
    // {/* ============================== */}
    // {/* ส่วนหัวข้อ + สถานะ fetching */}
    // {/* ============================== */}

    <div>
      {/*  */}
      {/* =================================================================== */}
      {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มสร้างข้อมูล (ขวาสุด) */}
      {/* =================================================================== */}

      <div
        className={cn(
          //
          "flex",
          "flex-wrap",
          "items-start sm:items-center",
          "justify-between",

          "gap-2 sm:gap-3",
          "pb-4 sm:pb-4",

          "border-b",
          //
        )}
      >
        {/*  */}
        {/* ========================== */}
        {/* 🟢 ปุ่มย้อนกลับ (ซ้ายสุด) */}
        {/* ========================== */}

        <Link
          href={backHref}
          className={cn(
            //
            "min-h-11 min-w-11 shrink-0 p-2", // เพื่อให้ตัวไอคอนลูกศรไม่เบียดขอบเขตของปุ่มจนเกินไป

            "rounded-full",
            // rounded-full + icon (h = w) + p-2 = ปุ่มกลายเป็น "วงกลม" ที่สมบูรณ์แบบครับ

            "text-muted-foreground bg-muted hover:bg-accent transition",
            //
          )}
        >
          <svg
            className={cn(
              //
              "h-6 w-6",
              //
            )}
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

        {/* ========================== */}
        {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด) */}
        {/* ========================== */}

        {/* ============================================ */}
        {/* 🟢 ส่วนหัวข้อ */}
        {/* ============================================ */}

        <div
          className={cn(
            //
            "flex-1",

            "min-w-0", // เปิดทางให้กล่องลูกสามารถใช้ truncate ได้

            "gap-4 sm:gap-6",
            //
          )}
        >
          {/*  */}
          {/* ============================= */}
          {/* 🟢 กลุ่มของส่วนหัวข้อ (ซ้าย) */}
          {/* ============================= */}

          <h2 // หัวข้อ
            className={cn(
              //
              "text-2xl sm:text-3xl",

              "break-words",

              "font-bold",
              "text-foreground",
              //
            )}
          >
            {title}
          </h2>

          <p // รายละเอียด (ใต้หัวข้อ) เช่น ชื่อองค์กรที่สังกัด
            className={cn(
              //
              "text-xs sm:text-sm",

              "break-words",

              "font-mono",
              "text-muted-foreground",
              //
            )}
          >
            {description}
          </p>

          {/* ============================= */}
          {/* 🟢 (จบ) ส่วนหัวข้อ */}
          {/* ============================= */}
          {/*  */}
        </div>

        {/* ======================== */}
        {/* Create Button (ขวา) */}
        {/* ======================== */}

        {
          // ตรวจสอบตัวแปรส่งเข้ามาครบ
          createHref !== undefined && createLabel !== undefined && (
            //

            <Link
              href={createHref}
              className={cn(
                //

                // ทำให้ปุ่มหน้าตาเป็นปุ่ม
                "min-h-11 w-full flex items-center justify-center gap-2 px-3 sm:w-auto sm:px-4 sm:py-2",
                "rounded-xl",

                "text-primary-foreground",
                "bg-primary",
                "hover:bg-primary/90",
                "active:bg-primary",
                "shadow-sm",
                "transition-colors",
                //
              )}
            >
              <svg
                className={cn(
                  //
                  "h-6 w-6",

                  "sm:hidden",
                  //
                )}
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
                  //
                  "text-xs sm:text-sm",

                  "break-words",

                  "font-medium",
                  //
                )}
              >
                + {createLabel}
              </span>
            </Link>
          )
        }

        {/* ======================== */}
        {/* (จบ) Create Button (ขวา) */}
        {/* ======================== */}
        {/*  */}
      </div>

      {/* =================================================================== */}
      {/* 🟢 (จบ) ปุ่มย้อนกลับ (ซ้ายสุด), ส่วนหัวข้อ (กลาง) และ ปุ่มสร้างข้อมูล (ขวาสุด) */}
      {/* =================================================================== */}

      {/* ====================== */}
      {/* 🌟 แถบสถานะข้อมูล */}
      {/* ====================== */}

      {
        // ตรวจสอบตัวแปรส่งเข้ามาครบ
        isFetching !== undefined &&
          errorQuery !== undefined &&
          refetch !== undefined &&
          dataUpdatedAt !== undefined && (
            //

            <div
              className={cn(
                //
                "flex",
                "flex-wrap",
                "items-center",
                "justify-end",

                "h-6", // fix ขนาด เพื่อให้หน้าจอไม่กระตุกเวลาเปลี่ยนสถานะ

                "text-xs",
                //
              )}
            >
              {
                // =================================
                // สถานะ: fetching
                // =================================

                isFetching ? (
                  <span
                    className={cn(
                      //
                      "flex",
                      "flex-wrap",
                      "items-center",

                      "gap-2",

                      "text-muted-foreground animate-pulse",
                      //
                    )}
                  >
                    <svg
                      className={cn(
                        //
                        "h-3.5 w-3.5",

                        "animate-spin text-primary",
                        //
                      )}
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
                ) : //

                // =================================
                // (จบ) สถานะ: fetching
                // =================================

                // =================================
                // สถานะ: error (in fetching)
                // =================================

                errorQuery ? (
                  <div
                    className={cn(
                      //
                      "flex",
                      "flex-wrap",
                      "items-center",

                      "gap-2",
                      //
                    )}
                  >
                    <span
                      className={cn(
                        //
                        "flex",
                        "flex-wrap",
                        "items-center",

                        "gap-1.5",

                        "font-medium text-destructive",
                        //
                      )}
                    >
                      <svg
                        className={cn(
                          //
                          "h-3.5 w-3.5",
                          //
                        )}
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
                        //
                        "font-semibold underline",
                        "text-primary hover:text-primary transition-colors",
                        "cursor-pointer",
                        //
                      )}
                    >
                      ลองใหม่
                    </button>
                  </div>
                ) : (
                  //
                  // =================================
                  // (จบ) สถานะ: error (in fetching)
                  // =================================

                  // =================================
                  // สถานะ: success (last fetching)
                  // =================================

                  dataUpdatedAt > 0 && (
                    <div
                      className={cn(
                        //
                        "flex",
                        "flex-wrap",
                        "items-center",

                        "gap-3",
                        //
                      )}
                    >
                      <span
                        className={cn(
                          //
                          "flex",
                          "flex-wrap",
                          "items-center",

                          "gap-1.5",

                          "text-muted-foreground",
                          //
                        )}
                      >
                        <svg
                          className={cn(
                            //
                            "h-3.5 w-3.5",

                            "text-green-500",
                            //
                          )}
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
                          //
                          "flex",
                          "flex-wrap",
                          "items-center",

                          "gap-1",

                          "font-medium text-muted-foreground hover:text-muted-foreground cursor-pointer transition-colors",
                          //
                        )}
                        title="กดเพื่ออัปเดตข้อมูลใหม่"
                      >
                        <svg
                          className={cn(
                            //
                            "h-3.5 w-3.5",
                            //
                          )}
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
                  )

                  // =================================
                  // (จบ) สถานะ: success (last fetching)
                  // =================================
                  //
                )
              }
            </div>
          )
      }

      {/* ====================== */}
      {/* 🌟 (จบ) แถบสถานะข้อมูล */}
      {/* ====================== */}
      {/*  */}
    </div>

    // {/* ============================== */}
    // {/* (จบ) ส่วนหัวข้อ + สถานะ fetching */}
    // {/* ============================== */}
  );
}
