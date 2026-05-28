"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarDays, Tag, LogOut, Scissors, Star, Users, FolderOpen, MessageSquareQuote, HelpCircle, Menu, X, Sparkles } from "lucide-react";
import { useDictionary } from "@/lib/i18n/DictionaryContext";
import { useLocale } from "@/lib/i18n/LocaleContext";
import LangSwitcher from "@/components/LangSwitcher";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const t = useDictionary();
  const locale = useLocale();

  const links = [
    { href: `/${locale}/admin`, label: t.admin.dashboard, Icon: LayoutDashboard },
    { href: `/${locale}/admin/orders`, label: t.admin.orders, Icon: CalendarDays },
    { href: `/${locale}/admin/categories`, label: t.admin.categories ?? "Categories", Icon: FolderOpen },
    { href: `/${locale}/admin/services`, label: t.admin.services, Icon: Scissors },
    { href: `/${locale}/admin/promos`, label: t.admin.promos, Icon: Tag },
    { href: `/${locale}/admin/points`, label: t.admin.points, Icon: Star },
    { href: `/${locale}/admin/feedbacks`, label: "Feedbacks", Icon: MessageSquareQuote },
    { href: `/${locale}/admin/faqs`, label: "FAQs", Icon: HelpCircle },
    { href: `/${locale}/admin/users`, label: t.admin.clients, Icon: Users },
  ];

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push(`/${locale}/admin/login`);
    router.refresh();
  };

  return (
    <>
      {/* Top bar with burger */}
      <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-pastel-pink">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-primary hover:bg-pastel-pink transition-all cursor-pointer">
            <Menu size={20} strokeWidth={2} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-primary" aria-hidden="true" />
            <span className="font-serif text-sm font-bold text-primary">{t.common.brand}</span>
          </div>
          <LangSwitcher locale={locale} />
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-50" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar drawer */}
      <div className={`md:hidden fixed top-0 left-0 bottom-0 w-72 bg-white z-50 flex flex-col transition-transform duration-300 ease-out shadow-2xl ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Header */}
        <div className="px-5 py-5 border-b border-pastel-pink flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary shrink-0" strokeWidth={2} aria-hidden="true" />
            <div>
              <span className="text-base font-black text-primary font-serif">{t.common.brand}</span>
              <p className="text-xs text-glam-text/50 mt-0.5">{t.admin.adminPanel}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:text-primary hover:bg-pastel-pink transition-all cursor-pointer">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {links.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer min-h-[48px] ${
                  active ? "bg-primary text-white shadow-sm shadow-primary/20" : "text-glam-text/60 hover:bg-pastel-pink hover:text-primary"
                }`}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-pastel-pink">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-glam-text/40 hover:text-red-400 hover:bg-red-50 transition-all duration-150 w-full cursor-pointer min-h-[48px]">
            <LogOut size={18} strokeWidth={2} aria-hidden="true" />
            {t.admin.logout}
          </button>
        </div>
      </div>
    </>
  );
}
