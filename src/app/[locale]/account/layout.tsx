import Link from "next/link";
import { Sparkles } from "lucide-react";
import LangSwitcher from "@/components/LangSwitcher";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getDictionary(locale as Locale);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-md mx-auto px-6 h-14 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-1.5 font-serif font-bold text-primary text-lg">
            <Sparkles size={15} aria-hidden="true" />
            {t.common.brand}
          </Link>
          <div className="flex items-center gap-2">
            <LangSwitcher locale={locale} />
            <Link href={`/${locale}/book`} className="text-xs font-semibold text-primary bg-pastel-pink px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer">
              {t.common.bookNow}
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
