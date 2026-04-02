"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "仪表盘", icon: "📊" },
  { href: "/products", label: "产品管理", icon: "📦" },
  { href: "/orders", label: "订单管理", icon: "📋" },
  { href: "/customers", label: "客户管理", icon: "👥" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">ERP 系统</h1>
        <p className="text-gray-400 text-sm mt-1">企业资源管理</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <form action="/erpreview/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full text-left px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            退出登录
          </button>
        </form>
      </div>
    </aside>
  );
}
