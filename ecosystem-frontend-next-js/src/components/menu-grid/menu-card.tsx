import Link from "next/link";
import { cn } from "@/lib/utils";

export function MenuCard({
  href,
  style = "standard",
  icon,
  title,
  description,
}: {
  href: string;
  style?: "primary" | "standard"; // เลือก Theme (ค่าเริ่มต้นคือ standard)
  icon: React.ReactNode; // รับ SVG icon เข้ามา
  title: string;
  description?: string;
}) {
  const isStylePrimary = style === "primary"; // เพื่อให้เขียน className สั้นลง

  return (
    <Link
      href={href}
      className={cn(
        //
        "group",

        "flex",
        "flex-col",

        "items-center",
        "text-center",

        "px-4",
        "py-6",

        "relative",

        "overflow-hidden",

        isStylePrimary ? "border-2" : "border",
        "rounded-2xl",

        isStylePrimary ? "bg-blue-50/50" : "bg-white",
        isStylePrimary ? "border-blue-100" : "border-gray-200",

        "cursor-pointer",

        "transition-all",
        isStylePrimary ? "hover:bg-blue-50" : "hover:bg-gray-50",
        isStylePrimary ? "hover:border-blue-300" : "hover:border-gray-300",
        "hover:shadow-md",
        //
      )}
    >
      <div
        className={cn(
          //
          "w-12 h-12",
          "rounded-xl",

          "flex",
          "items-center",
          "justify-center",

          isStylePrimary ? "bg-blue-500" : "bg-gray-100",
          isStylePrimary ? "text-white" : "text-gray-600",

          "transition-all",
          isStylePrimary ? "group-hover:scale-110" : "group-hover:bg-white",
          "group-hover:shadow-sm",

          "shrink-0",

          "mb-4",
          //
        )}
      >
        {icon}
      </div>

      <h4
        className={cn(
          //
          "text-lg",

          "font-bold",

          isStylePrimary ? "text-gray-900" : "text-gray-800",
          isStylePrimary ? "group-hover:text-blue-700" : "",
          isStylePrimary ? "transition-colors" : "",
          //
        )}
      >
        {title}
      </h4>

      {description !== undefined && (
        <p
          className={cn(
            //
            "text-sm",

            "text-gray-500",

            "mt-1",
            //
          )}
        >
          {description}
        </p>
      )}
    </Link>
  );
}
