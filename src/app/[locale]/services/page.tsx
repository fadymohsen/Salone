import Link from "next/link";
import {
  Sparkles, Gem, Star, Palette, Eye, Scissors, Heart, Wand2,
  Brush, Crown, Leaf, Sun, Zap, Droplets, Flower2, Ribbon,
  ArrowRight, ArrowLeft,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Gem, Star, Palette, Eye, Scissors, Heart, Wand2,
  Brush, Crown, Leaf, Sun, Zap, Droplets, Flower2, Ribbon,
};

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getDictionary(locale as Locale);
  const l = (path: string) => `/${locale}${path}`;

  let dbServices: Awaited<ReturnType<typeof prisma.service.findMany<{
    where: { isActive: true };
    orderBy: { sortOrder: "asc" };
    include: { category: true };
  }>>> = [];
  let dbCategories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];

  try {
    [dbServices, dbCategories] = await Promise.all([
      prisma.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { category: true } }),
      prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
  } catch {
    // DB not reachable
  }

  // Group services by category
  const grouped: { categoryName: string; categoryNameAr: string | null; services: typeof dbServices }[] = [];
  if (dbCategories.length > 0) {
    for (const cat of dbCategories) {
      const catServices = dbServices.filter((s) => s.categoryId === cat.id);
      if (catServices.length > 0) grouped.push({ categoryName: cat.name, categoryNameAr: cat.nameAr, services: catServices });
    }
    const uncategorized = dbServices.filter((s) => !s.categoryId);
    if (uncategorized.length > 0) grouped.push({ categoryName: "Other", categoryNameAr: "أخرى", services: uncategorized });
  } else if (dbServices.length > 0) {
    grouped.push({ categoryName: "", categoryNameAr: null, services: dbServices });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 sm:h-16 flex items-center gap-3">
          <Link href={l("/")} aria-label={t.common.back}
            className="w-9 h-9 rounded-xl bg-pastel-pink flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer">
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
          <span className="font-serif text-lg font-bold text-glam-text">{t.services.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.12em] bg-pastel-pink px-4 py-1.5 rounded-full mb-4">
            {t.services.tagline}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-glam-text">{t.services.title}</h1>
          <p className="text-muted mt-3 max-w-xs mx-auto text-sm leading-relaxed">{t.services.subtitle}</p>
        </div>

        {grouped.length > 0 ? (
          <div className="space-y-14">
            {grouped.map((group) => (
              <div key={group.categoryName}>
                {group.categoryName && (
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-glam-text mb-6">
                    {locale === "ar" ? (group.categoryNameAr || group.categoryName) : group.categoryName}
                  </h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                  {group.services.map((s) => {
                    const Icon = s.iconName ? (ICON_MAP[s.iconName] ?? Sparkles) : Sparkles;
                    return (
                      <div key={s.id} className="group relative bg-white rounded-3xl p-6 border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 flex flex-col">
                        {s.popular && (
                          <span className="absolute top-4 end-4 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            {t.services.mostPopular}
                          </span>
                        )}
                        <div className="w-11 h-11 rounded-2xl bg-pastel-pink flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors duration-200">
                          <Icon size={20} className="text-primary" aria-hidden="true" strokeWidth={1.75} />
                        </div>
                        <h3 className="font-serif text-base font-semibold text-glam-text mb-2">{locale === "ar" ? (s.nameAr || s.name) : s.name}</h3>
                        <p className="text-sm text-muted leading-relaxed mb-5 flex-1">{locale === "ar" ? (s.descriptionAr || s.description || "") : (s.description ?? "")}</p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                          <span className="text-sm font-bold text-primary">{t.services.from} {s.price} {t.common.egp}</span>
                          <Link
                            href={`${l("/book")}?service=${encodeURIComponent(s.name)}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-pastel-pink px-3.5 py-2 rounded-full hover:bg-primary hover:text-white transition-all duration-150 cursor-pointer"
                            aria-label={`${t.services.book} ${s.name}`}
                          >
                            {t.services.book} <ArrowRight size={11} aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-border">
            <Sparkles size={32} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm text-muted mb-4">{t.services.comingSoon}</p>
          </div>
        )}
      </div>
    </div>
  );
}
