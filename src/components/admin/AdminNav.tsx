"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarDays, BarChart3, Tag, LogOut, Scissors, Star, Users, Image } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: CalendarDays },
  { href: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
  { href: "/admin/promos", label: "Promos", Icon: Tag },
  { href: "/admin/services", label: "Services", Icon: Scissors },
  { href: "/admin/gallery", label: "Gallery", Icon: Image },
  { href: "/admin/points", label: "Points", Icon: Star },
  { href: "/admin/users", label: "Clients", Icon: Users },
];

export default function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  if (mobile) {
    return (
      <div className="flex items-center justify-around px-2 py-1">
        {links.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-150 text-xs font-bold min-h-[44px] min-w-[44px] cursor-pointer ${
                active ? "text-primary bg-pastel-pink" : "text-glam-text/50 hover:text-primary"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-glam-text/40 hover:text-red-400 text-xs font-bold transition-all duration-150 min-h-[44px] min-w-[44px] cursor-pointer"
        >
          <LogOut size={18} strokeWidth={2} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    );
  }

  return (
    <nav className="flex-1 px-3 py-4 flex flex-col justify-between">
      <div className="space-y-1">
        {links.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer min-h-[44px] ${
                active
                  ? "bg-primary text-white shadow-sm shadow-primary/20"
                  : "text-glam-text/60 hover:bg-pastel-pink hover:text-primary"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-glam-text/40 hover:text-red-400 hover:bg-red-50 transition-all duration-150 w-full cursor-pointer min-h-[44px]"
      >
        <LogOut size={16} strokeWidth={2} aria-hidden="true" />
        Log out
      </button>
    </nav>
  );
}
