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

        isStylePrimary ? "bg-primary/10" : "bg-card",
        isStylePrimary ? "border-primary/20" : "border-border",

        "cursor-pointer",

        "transition-all",
        isStylePrimary ? "hover:bg-primary/10" : "hover:bg-background",
        isStylePrimary ? "hover:border-primary/20" : "hover:border-border",
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

          isStylePrimary ? "bg-primary" : "bg-muted",
          isStylePrimary ? "text-primary-foreground" : "text-muted-foreground",

          "transition-all",
          isStylePrimary ? "group-hover:scale-110" : "group-hover:bg-card",
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

          isStylePrimary ? "text-foreground" : "text-foreground",
          isStylePrimary ? "group-hover:text-primary" : "",
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

            "text-muted-foreground",

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
