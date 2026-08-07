"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Building2 } from "lucide-react"; // 🌟 นำเข้าไอคอน lucide-react (ซึ่งเป็นของคู่กันกับ Shadcn)

export default function Sidebar() {
  const pathname = usePathname();

  // เมนูที่เราต้องการให้มีใน Sidebar
  const menus = [
    { name: "หน้าหลัก", path: "/", icon: Home },
    {
      name: "จัดการองค์กร",
      path: "/organizations",
      icon: Building2,
    },
  ];

  return (
    <aside className="w-56 bg-white border-r shadow-sm flex flex-col p-4 h-full">
      <div className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider px-3">
        เมนูส่วนกลาง
      </div>
      <nav className="flex flex-col gap-1">
        {menus.map((menu) => {
          // const isActive = pathname === menu.path; // กรณี path ตรงเป๊ะ ตัวลูกจะไม่แสดง เช่น organizations/settings

          // 🌟 ปรับ Logic การเช็ค Active ให้รองรับ Nested Routes
          const isActive =
            menu.path === "/"
              ? pathname === "/" // หน้า Home ต้องตรงเป๊ะ
              : pathname.startsWith(menu.path); // หน้าอื่น แค่ขึ้นต้นด้วย path ก็พอ

          const Icon = menu.icon; // ดึงไอคอนมาใช้

          return (
            <Link
              key={menu.path}
              href={menu.path}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {/* 🌟 แสดงผลไอคอน */}
              <Icon
                size={18}
                className={isActive ? "text-blue-700" : "text-gray-400"}
              />
              {menu.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
