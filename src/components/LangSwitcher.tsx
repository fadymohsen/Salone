"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function LangSwitcher({ locale }: { locale: string }) {
  const pathname = usePathname();
  const targetLocale = locale === "ar" ? "en" : "ar";
  const targetLabel = locale === "ar" ? "EN" : "عربي";

  // Replace /en/... with /ar/... or vice versa
  const targetPath = pathname.replace(`/${locale}`, `/${targetLocale}`) || `/${targetLocale}`;

  return (
    <Link
      href={targetPath}
      className="inline-flex items-center justify-center text-xs font-bold px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors duration-150 cursor-pointer"
    >
      {targetLabel}
    </Link>
  );
}
