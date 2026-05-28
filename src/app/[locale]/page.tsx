import Link from "next/link";
import {
  Sparkles, Gem, Star, Palette, Eye, Scissors, Heart, Wand2,
  Brush, Crown, Leaf, Sun, Zap, Droplets, Flower2, Ribbon,
  MapPin, MessageCircle, ArrowRight,
  CheckCircle2, ChevronRight, Gift, Trophy, Ticket,
} from "lucide-react";
import FaqAccordion from "@/components/FaqAccordion";
import LangSwitcher from "@/components/LangSwitcher";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Gem, Star, Palette, Eye, Scissors, Heart, Wand2,
  Brush, Crown, Leaf, Sun, Zap, Droplets, Flower2, Ribbon,
};

const LOYALTY_ICONS = [Trophy, Gift, Ticket];
const AVATARS = ["#FECDD3", "#FDA4AF", "#F0ABFC"];

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getDictionary(locale as Locale);
  const l = (path: string) => `/${locale}${path}`;

  let dbServices: Awaited<ReturnType<typeof prisma.service.findMany<{
    where: { isActive: true };
    orderBy: { sortOrder: "asc" };
    include: { category: true };
  }>>> = [];
  let dbCategories: Awaited<ReturnType<typeof prisma.category.findMany>> = [];
  let pointsConfig: { pointsPerBooking: number; pointsThreshold: number; couponDiscount: number } | null = null;

  let dbTestimonials: Awaited<ReturnType<typeof prisma.testimonial.findMany>> = [];
  let dbFaqs: Awaited<ReturnType<typeof prisma.faq.findMany>> = [];

  try {
    [dbServices, dbCategories, pointsConfig, dbTestimonials, dbFaqs] = await Promise.all([
      prisma.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { category: true } }),
      prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.pointsConfig.findFirst(),
      prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
  } catch {
    // DB not reachable
  }

  const services = dbServices.length > 0 ? dbServices : null;
  const categories = dbCategories.length > 0 ? dbCategories : null;

  // Group services by category
  const grouped: { categoryName: string; categoryNameAr: string | null; services: typeof dbServices }[] = [];
  if (services && categories) {
    for (const cat of categories) {
      const catServices = services.filter((s) => s.categoryId === cat.id);
      if (catServices.length > 0) grouped.push({ categoryName: cat.name, categoryNameAr: cat.nameAr, services: catServices });
    }
    const uncategorized = services.filter((s) => !s.categoryId);
    if (uncategorized.length > 0) grouped.push({ categoryName: "Other", categoryNameAr: "أخرى", services: uncategorized });
  } else if (services) {
    grouped.push({ categoryName: "", categoryNameAr: null, services });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-border/60 shadow-sm shadow-black/[0.03]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href={l("/")} className="flex items-center gap-2 group cursor-pointer">
            <span className="font-serif text-xl sm:text-2xl font-bold text-primary tracking-tight group-hover:text-secondary transition-colors duration-200">{t.common.brand}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LangSwitcher locale={locale} />
            <Link
              href={l("/account/dashboard")}
              className="inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-full border border-border/80 text-glam-text/60 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer"
              aria-label={t.common.myAccount}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="hidden sm:inline text-sm font-semibold">{t.common.myAccount}</span>
            </Link>
            <Link
              href={l("/book")}
              className="inline-flex items-center gap-1.5 bg-primary text-white font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm hover:bg-secondary hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 shadow-md shadow-primary/20 cursor-pointer active:scale-[0.97]"
            >
              {t.common.bookNow}
              <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-[calc(100dvh-64px)] flex items-center overflow-hidden px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF1F2]/70 via-[#FFFDF9] to-[#FFFDF9] -z-10" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl -z-10" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-secondary/5 blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="text-center md:text-start">
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-glam-text leading-[1.08] tracking-tight mb-5">
              {t.hero.title1}<br />
              <span className="text-primary italic">{t.hero.title2}</span>
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-sm mx-auto md:mx-0 mb-5 leading-relaxed">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-1.5 mb-8">
              {t.hero.perks.map((p: string) => (
                <span key={p} className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <CheckCircle2 size={13} className="text-primary shrink-0" aria-hidden="true" />
                  {p}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm mx-auto md:mx-0 mb-10">
              <Link
                href={l("/book")}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-7 py-4 rounded-2xl shadow-lg shadow-primary/30 hover:bg-secondary transition-all duration-200 active:scale-[0.97] cursor-pointer text-base"
              >
                {t.common.bookNow}
                <Sparkles size={16} aria-hidden="true" />
              </Link>
              <a
                href="#services"
                className="flex-1 inline-flex items-center justify-center bg-white border border-border text-glam-text font-semibold px-7 py-4 rounded-2xl hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer text-base"
              >
                {t.hero.seeServices}
              </a>
            </div>
          </div>

          {/* Hero image */}
          <div className="flex justify-center relative mt-4 md:mt-0">
            <div className="absolute -top-6 -right-6 w-[280px] h-[280px] md:w-[360px] md:h-[360px] rounded-full border-2 border-dashed border-primary/15 -z-10" aria-hidden="true" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-primary/10 blur-2xl -z-10" aria-hidden="true" />

            <div className="relative w-[280px] h-[380px] md:w-[360px] md:h-[480px] rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 ring-1 ring-white/50">
              <img src="/hero.jpg" alt={t.hero.badgeTitle} width={800} height={1060} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-glam-text leading-tight">{t.hero.badgeTitle}</p>
                  <p className="text-xs text-muted">{t.hero.badgeSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="px-6 py-24 max-w-6xl mx-auto w-full scroll-mt-16">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.12em] bg-pastel-pink px-4 py-1.5 rounded-full mb-4">
            {t.services.tagline}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-glam-text">{t.services.title}</h2>
          <p className="text-muted mt-3 max-w-xs mx-auto text-sm leading-relaxed">{t.services.subtitle}</p>
        </div>

        {services ? (() => {
          const featured = services.filter((s) => s.featured);
          const displayServices = featured.length > 0 ? featured.slice(0, 6) : services.slice(0, 6);
          return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {displayServices.map((s) => {
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
            {services.length > displayServices.length && (
              <div className="text-center mt-10">
                <Link href={l("/services")} className="inline-flex items-center gap-2 bg-white border border-border text-glam-text font-bold px-8 py-3.5 rounded-2xl hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer text-sm shadow-sm">
                  {t.services.viewAll} <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            )}
          </>
          );
        })() : (
          <div className="text-center py-16 bg-white rounded-3xl border border-border">
            <Sparkles size={32} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm text-muted mb-4">{t.services.comingSoon}</p>
            <Link href={l("/book")} className="inline-flex items-center gap-1.5 bg-primary text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-secondary transition-all cursor-pointer">
              {t.common.bookNow} <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="px-6 py-24 bg-pastel-pink/50 scroll-mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.12em] bg-white border border-border px-4 py-1.5 rounded-full mb-4">
              {t.howItWorks.tagline}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-glam-text">{t.howItWorks.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            <div className="hidden md:block absolute top-9 left-[calc(33%+20px)] right-[calc(33%+20px)] h-px border-t-2 border-dashed border-primary/20" aria-hidden="true" />
            {t.howItWorks.steps.map((step: { num: string; title: string; desc: string }) => (
              <div key={step.num} className="relative bg-white rounded-3xl p-7 border border-border text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-5">
                  <span className="font-serif text-lg font-bold text-primary">{step.num}</span>
                </div>
                <h3 className="font-serif text-base font-semibold text-glam-text mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href={l("/book")}
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-10 py-4 rounded-2xl shadow-lg shadow-primary/30 hover:bg-secondary transition-all duration-200 active:scale-[0.97] cursor-pointer"
            >
              {t.howItWorks.reserveSpot}
              <Sparkles size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 py-24 bg-pastel-pink/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.12em] bg-white border border-border px-4 py-1.5 rounded-full mb-4">
              {t.testimonials.tagline}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-glam-text">{t.testimonials.title}</h2>
            <p className="text-muted mt-3 text-sm">{t.testimonials.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(dbTestimonials.length > 0 ? dbTestimonials : t.testimonials.items).map((item: { quote?: string; quoteAr?: string | null; name?: string; nameAr?: string | null; service?: string | null; serviceAr?: string | null }, i: number) => {
              const name = locale === "ar" ? ((item as Record<string, string>).nameAr || item.name) : item.name;
              const quote = locale === "ar" ? ((item as Record<string, string>).quoteAr || item.quote) : item.quote;
              const svc = locale === "ar" ? ((item as Record<string, string>).serviceAr || item.service) : item.service;
              return (
                <div key={i} className="bg-white rounded-3xl p-7 border border-border flex flex-col shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  <div className="flex gap-0.5 mb-5" aria-label="5 star rating">
                    {Array.from({ length: 5 }, (_, j) => (
                      <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" aria-hidden="true">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-muted leading-relaxed flex-1 mb-6 italic">&ldquo;{quote}&rdquo;</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold text-sm shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: AVATARS[i % AVATARS.length] }} aria-hidden="true">
                      {(name ?? "?")[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-glam-text">{name}</p>
                      {svc && <p className="text-xs text-muted">{svc}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LOYALTY POINTS */}
      <section className="px-6 py-24 max-w-6xl mx-auto w-full">
        <div className="relative bg-gradient-to-br from-primary/5 via-pastel-pink/60 to-secondary/5 rounded-[2rem] border border-primary/10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl -translate-y-1/2 translate-x-1/3" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-secondary/5 blur-3xl translate-y-1/3 -translate-x-1/4" aria-hidden="true" />

          <div className="relative z-10 px-6 sm:px-10 py-14 sm:py-16">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.12em] bg-white border border-border px-4 py-1.5 rounded-full mb-4">
                <Gift size={13} aria-hidden="true" />
                {t.loyalty.tagline}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-glam-text">
                {t.loyalty.title1} <span className="text-primary italic">{t.loyalty.title2}</span>
              </h2>
              <p className="text-muted mt-3 max-w-md mx-auto text-sm leading-relaxed">{t.loyalty.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {t.loyalty.steps.map((step: { title: string; desc: string }, i: number) => {
                const Icon = LOYALTY_ICONS[i];
                return (
                  <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center border border-white shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
                      <Icon size={22} className="text-primary" aria-hidden="true" strokeWidth={1.75} />
                    </div>
                    <h3 className="font-serif text-base font-semibold text-glam-text mb-1.5">{step.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <Link href={l("/account/register")} className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-primary/25 hover:bg-secondary transition-all duration-200 active:scale-[0.97] cursor-pointer text-base">
                {t.loyalty.createAccount}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <p className="text-xs text-muted mt-3">{t.loyalty.alreadyHaveAccount} <Link href={l("/account/login")} className="text-primary font-semibold hover:underline">{t.loyalty.signIn}</Link></p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24 bg-pastel-pink/30 scroll-mt-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.12em] bg-white border border-border px-4 py-1.5 rounded-full mb-4">
              {t.faq.tagline}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-glam-text">{t.faq.title}</h2>
            <p className="text-muted mt-3 text-sm">{t.faq.subtitle}</p>
          </div>

          <FaqAccordion items={dbFaqs.length > 0 ? dbFaqs.map(f => ({
            q: locale === "ar" ? (f.questionAr || f.question) : f.question,
            a: locale === "ar" ? (f.answerAr || f.answer) : f.answer,
          })) : t.faq.items} />

          <div className="text-center mt-10">
            <p className="text-sm text-muted">
              {t.faq.stillHaveQuestions}{" "}
              <a href="https://wa.me/201000000000" className="text-primary font-semibold hover:underline">
                {t.common.chatOnWhatsApp}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="px-6 py-10">
        <div className="max-w-4xl mx-auto bg-primary rounded-3xl px-8 py-16 text-center relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/8" aria-hidden="true" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-black/8" aria-hidden="true" />
          <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-white/5 -translate-y-1/2" aria-hidden="true" />

          <p className="text-white/70 text-sm font-medium mb-3 relative z-10 uppercase tracking-wider">{t.cta.limitedSlots}</p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 relative z-10 leading-tight">{t.cta.title}</h2>
          <p className="text-white/65 text-base mb-10 relative z-10 max-w-sm mx-auto leading-relaxed">{t.cta.subtitle}</p>
          <Link href={l("/book")} className="relative z-10 inline-flex items-center gap-2 bg-white text-primary font-bold px-10 py-4 rounded-2xl hover:bg-pastel-pink transition-colors duration-200 cursor-pointer shadow-lg active:scale-[0.97] text-base">
            {t.cta.button}
            <Sparkles size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#2A2A30] text-white">
        <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary/40" />
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 pb-10 border-b border-white/8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-serif text-2xl font-bold text-primary">{t.common.brand}</span>
              </div>
              <p className="text-white/45 text-sm leading-relaxed max-w-[200px] mb-6">{t.footer.tagline}</p>
              <div className="flex items-center gap-3">
                <a href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-green-400 transition-colors duration-150 cursor-pointer" aria-label={t.common.whatsappUs}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a href="https://instagram.com/veliq.co" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-primary transition-colors duration-150 cursor-pointer" aria-label="Follow on Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="https://facebook.com/veliq.co" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-primary transition-colors duration-150 cursor-pointer" aria-label="Follow on Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-white/35 uppercase tracking-[0.12em] mb-5">{t.footer.locationsTitle}</p>
              <ul className="space-y-3.5">
                <li>
                  <p className="text-sm font-semibold text-white/70">{t.footer.heliopolis}</p>
                  <p className="text-xs text-white/35 mt-0.5">{t.footer.hours}</p>
                </li>
                <li>
                  <p className="text-sm font-semibold text-white/70">{t.footer.newCairo}</p>
                  <p className="text-xs text-white/35 mt-0.5">{t.footer.hours}</p>
                </li>
              </ul>
              <div className="mt-5 flex items-center gap-2 text-white/35 text-xs">
                <MapPin size={12} className="text-primary shrink-0" aria-hidden="true" />
                {t.footer.cairoEgypt}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-white/35 uppercase tracking-[0.12em] mb-5">{t.footer.quickLinksTitle}</p>
              <ul className="space-y-2.5">
                {[
                  { label: t.footer.links.bookNow, href: l("/book") },
                  { label: t.footer.links.myAccount, href: l("/account/login") },
                  { label: t.footer.links.services, href: "#services" },
                  { label: t.footer.links.howItWorks, href: "#how" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/55 hover:text-primary transition-colors duration-150 cursor-pointer">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
            <span>© {new Date().getFullYear()} {t.footer.copyright}</span>
            <div className="flex items-center gap-4">
              <span>{t.footer.poweredBy} <a href="https://veliq.co" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-secondary font-semibold transition-colors duration-150 cursor-pointer">VELIQ</a></span>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-white/90 backdrop-blur-lg border-t border-border z-50 sm:hidden">
        <Link href={l("/book")} className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl w-full shadow-lg shadow-primary/25 cursor-pointer active:scale-[0.98] transition-transform duration-150">
          {t.mobileCta.button}
          <Sparkles size={16} aria-hidden="true" />
        </Link>
      </div>

    </div>
  );
}
