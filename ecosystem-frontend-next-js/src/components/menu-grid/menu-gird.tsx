import { cn } from "@/lib/utils";

export function MenuGrid({
  title,
  minWidth,
  children,
}: {
  title?: string;
  minWidth: number;
  children?: React.ReactNode; // เพื่อรับ <MenuCard /> เข้ามาเรียงต่อกัน
}) {
  return (
    <div
      className={cn(
        //
        "flex",
        "flex-col",

        "gap-2 sm:gap-3",
        //
      )}
    >
      {title !== undefined && (
        <h3
          className={cn(
            //
            "text-lg",

            "font-bold text-gray-800",
            //
          )}
        >
          {title}
        </h3>
      )}

      <div
        className={cn(
          //
          "grid",
          // "grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))]", (ย้ายไปเขียนใน style เพื่อรับ minWidth)

          "gap-2 sm:gap-3",
          //
        )}
        //

        // Tailwind ไม่ถนัดการอ่าน class ที่มีการต่อ string (ให้ย้ายส่วนนั้นไปเขียนใน style แทน)

        // นำ class ที่ต่อ string มาเขียนใน style แทน เพื่อให้ใส่ตัวแปร dynamic เข้าไปได้
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minWidth}rem), 1fr))`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
