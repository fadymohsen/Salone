import Link from "next/link";
import {
  Sparkles, Gem, Star, Palette, Eye, Scissors, Heart, Wand2,
  Brush, Crown, Leaf, Sun, Zap, Droplets, Flower2, Ribbon,
  MapPin, AtSign, MessageCircle, ArrowRight,
  CheckCircle2, ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/db";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Gem, Star, Palette, Eye, Scissors, Heart, Wand2,
  Brush, Crown, Leaf, Sun, Zap, Droplets, Flower2, Ribbon,
};

const STEPS = [
  { num: "01", title: "Pick Your Look", desc: "Browse services and choose the style that speaks to you." },
  { num: "02", title: "Choose Your Slot", desc: "Select a date and time that works perfectly for you." },
  { num: "03", title: "Show Up & Shine", desc: "Arrive, relax, and leave looking absolutely flawless." },
];

const GALLERY_FALLBACK = [
  { title: "French Rose Acrylics", img: "https://images.unsplash.com/photo-1604654894610-df4906b147c0?auto=format&fit=crop&w=600&q=80", slug: "French Rose Acrylics" },
  { title: "Glazed Donut Nails", img: "https://images.unsplash.com/photo-1632345031435-8797b2d58045?auto=format&fit=crop&w=600&q=80", slug: "Glazed Donut Nails" },
  { title: "Vanilla Velvet Set", img: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80", slug: "Vanilla Velvet Set" },
  { title: "Lash Lift & Glow", img: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=600&q=80", slug: "Lash Lift & Glow" },
  { title: "Nail Art Design", img: "https://images.unsplash.com/photo-1604654894610-df4906b147c0?auto=format&fit=crop&w=600&q=80", slug: "Vanilla Velvet Set" },
  { title: "Classic Manicure", img: "https://images.unsplash.com/photo-1632345031435-8797b2d58045?auto=format&fit=crop&w=600&q=80", slug: "Classic Manicure" },
];

const PERKS = [
  "No deposits, no hidden fees",
  "Instant confirmation",
  "Easy reschedule anytime",
];

const STATS = [
  { value: "200+", label: "Happy Clients" },
  { value: "4.9", label: "Average Rating" },
  { value: "2", label: "Cairo Locations" },
  { value: "60s", label: "To Book" },
];

const TESTIMONIALS = [
  {
    quote: "The glazed donut nails were absolutely perfect! Lasted 3 weeks without a single chip.",
    name: "Sara H.",
    service: "Glazed Donut Nails",
    avatar: "#FECDD3",
  },
  {
    quote: "Super easy to book online and the results were stunning. I've never gotten so many compliments.",
    name: "Nadia K.",
    service: "French Rose Acrylics",
    avatar: "#FDA4AF",
  },
  {
    quote: "Best nail experience in Cairo. Clean, professional, and the lash lift was life-changing.",
    name: "Mariam R.",
    service: "Lash Lift & Glow",
    avatar: "#F0ABFC",
  },
];

export default async function LandingPage() {
  let dbServices: Awaited<ReturnType<typeof prisma.service.findMany>> = [];
  let dbGallery: Awaited<ReturnType<typeof prisma.galleryImage.findMany>> = [];

  try {
    [dbServices, dbGallery] = await Promise.all([
      prisma.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.galleryImage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
  } catch {
    // DB not reachable — render with fallback content
  }

  const services = dbServices.length > 0 ? dbServices : null;
  const gallery = dbGallery.length > 0
    ? dbGallery.map((g) => ({ title: g.title, img: g.imageUrl, slug: g.serviceId ?? g.title }))
    : GALLERY_FALLBACK;

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HEADER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-xl font-bold text-primary tracking-tight">GlowBook</span>

          <nav className="hidden sm:flex items-center gap-8 text-sm font-medium text-glam-text/70" aria-label="Main navigation">
            <a href="#services" className="hover:text-primary transition-colors duration-150 cursor-pointer">Services</a>
            <a href="#how" className="hover:text-primary transition-colors duration-150 cursor-pointer">How It Works</a>
            <a href="#gallery" className="hover:text-primary transition-colors duration-150 cursor-pointer">Gallery</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/account/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-glam-text/70 hover:text-primary transition-colors duration-150 cursor-pointer"
            >
              My Account
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-secondary transition-colors duration-200 shadow-md shadow-primary/25 cursor-pointer"
            >
              Book Now
              <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO  — split layout on desktop, centred on mobile
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative min-h-[calc(100dvh-64px)] flex items-center overflow-hidden px-6 py-12">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF1F2]/70 via-[#FFFDF9] to-[#FFFDF9] -z-10" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl -z-10" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-secondary/5 blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* ── Left: copy ── */}
          <div className="text-center md:text-left">
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-glam-text leading-[1.08] tracking-tight mb-5">
              Your Nails.<br />
              <span className="text-primary italic">Perfected.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-sm mx-auto md:mx-0 mb-5 leading-relaxed">
              Premium nail artistry &amp; beauty treatments in Cairo.
              Book your slot in under 60 seconds.
            </p>

            {/* Perks */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-1.5 mb-8">
              {PERKS.map((p) => (
                <span key={p} className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <CheckCircle2 size={13} className="text-primary shrink-0" aria-hidden="true" />
                  {p}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm mx-auto md:mx-0 mb-10">
              <Link
                href="/book"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-7 py-4 rounded-2xl shadow-lg shadow-primary/30 hover:bg-secondary transition-all duration-200 active:scale-[0.97] cursor-pointer text-base"
              >
                Book Now
                <Sparkles size={16} aria-hidden="true" />
              </Link>
              <a
                href="#services"
                className="flex-1 inline-flex items-center justify-center bg-white border border-border text-glam-text font-semibold px-7 py-4 rounded-2xl hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer text-base"
              >
                See Services
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="flex -space-x-2.5" aria-hidden="true">
                {["#FECDD3","#FCA5A5","#FDA4AF","#F9A8D4","#F0ABFC"].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-sm text-muted">
                Trusted by <strong className="text-primary font-semibold">200+</strong> happy clients
              </p>
            </div>
          </div>

          {/* ── Right: decorative image card (desktop only) ── */}
          <div className="hidden md:flex justify-center relative">
            <div className="relative w-[340px] h-[460px] rounded-3xl overflow-hidden shadow-2xl shadow-primary/15">
              <img
                src="https://images.unsplash.com/photo-1604654894610-df4906b147c0?auto=format&fit=crop&w=700&q=85"
                alt="Nail artistry at GlowBook"
                width={700}
                height={920}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>
          </div>

        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SERVICES
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="services" className="px-6 py-24 max-w-6xl mx-auto w-full scroll-mt-16">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.12em] bg-pastel-pink px-4 py-1.5 rounded-full mb-4">
            What We Offer
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-glam-text">Our Services</h2>
          <p className="text-muted mt-3 max-w-xs mx-auto text-sm leading-relaxed">
            Every look crafted with precision, care, and a love for detail.
          </p>
        </div>

        {services ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {services.map((s) => {
              const Icon = s.iconName ? (ICON_MAP[s.iconName] ?? Sparkles) : Sparkles;
              return (
                <div
                  key={s.id}
                  className="group relative bg-white rounded-3xl p-6 border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 flex flex-col"
                >
                  {s.popular && (
                    <span className="absolute top-4 right-4 text-xs font-bold text-primary bg-pastel-pink px-2.5 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className="w-11 h-11 rounded-2xl bg-pastel-pink flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors duration-200">
                    <Icon size={20} className="text-primary" aria-hidden="true" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-serif text-base font-semibold text-glam-text mb-2">{s.name}</h3>
                  <p className="text-sm text-muted leading-relaxed mb-5 flex-1">{s.description ?? ""}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <span className="text-sm font-bold text-primary">From {s.price} EGP</span>
                    <Link
                      href={`/book?service=${encodeURIComponent(s.name)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-pastel-pink px-3.5 py-2 rounded-full hover:bg-primary hover:text-white transition-all duration-150 cursor-pointer"
                      aria-label={`Book ${s.name}`}
                    >
                      Book <ArrowRight size={11} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-border">
            <Sparkles size={32} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm text-muted mb-4">Services coming soon — check back shortly.</p>
            <Link href="/book" className="inline-flex items-center gap-1.5 bg-primary text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-secondary transition-all cursor-pointer">
              Book Now <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HOW IT WORKS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="how" className="px-6 py-24 bg-pastel-pink/50 scroll-mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.12em] bg-white border border-border px-4 py-1.5 rounded-full mb-4">
              Simple Process
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-glam-text">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            <div className="hidden md:block absolute top-9 left-[calc(33%+20px)] right-[calc(33%+20px)] h-px border-t-2 border-dashed border-primary/20" aria-hidden="true" />
            {STEPS.map((step) => (
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
              href="/book"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-10 py-4 rounded-2xl shadow-lg shadow-primary/30 hover:bg-secondary transition-all duration-200 active:scale-[0.97] cursor-pointer"
            >
              Reserve My Spot
              <Sparkles size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          GALLERY
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="gallery" className="px-6 py-24 max-w-6xl mx-auto w-full scroll-mt-16">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.12em] bg-pastel-pink px-4 py-1.5 rounded-full mb-4">
            Our Work
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-glam-text">Mastered Creations</h2>
          <p className="text-muted mt-3 text-sm">Real results. Real clients.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {gallery.map((item, i) => (
            <Link
              key={i}
              href={`/book?service=${encodeURIComponent(item.slug)}`}
              className="group relative rounded-2xl overflow-hidden aspect-square block bg-pastel-pink cursor-pointer"
              aria-label={`Book ${item.title}`}
            >
              <img
                src={item.img}
                alt={item.title}
                loading={i < 3 ? "eager" : "lazy"}
                width={600}
                height={600}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4">
                <div className="flex items-center justify-between w-full">
                  <span className="text-white font-semibold text-sm">{item.title}</span>
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">Book</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TESTIMONIALS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-6 py-24 bg-pastel-pink/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.12em] bg-white border border-border px-4 py-1.5 rounded-full mb-4">
              Client Love
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-glam-text">What Our Clients Say</h2>
            <p className="text-muted mt-3 text-sm">Straight from the people who matter most.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-3xl p-7 border border-border flex flex-col shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                {/* Stars */}
                <div className="flex gap-0.5 mb-5" aria-label="5 star rating">
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm text-muted leading-relaxed flex-1 mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Client */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-primary font-bold text-sm shrink-0 border-2 border-white shadow-sm"
                    style={{ backgroundColor: t.avatar }}
                    aria-hidden="true"
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-glam-text">{t.name}</p>
                    <p className="text-xs text-muted">{t.service}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PRE-FOOTER CTA BANNER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="px-6 py-10">
        <div className="max-w-4xl mx-auto bg-primary rounded-3xl px-8 py-16 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/8" aria-hidden="true" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-black/8" aria-hidden="true" />
          <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-white/5 -translate-y-1/2" aria-hidden="true" />

          <p className="text-white/70 text-sm font-medium mb-3 relative z-10 uppercase tracking-wider">Limited slots available daily</p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 relative z-10 leading-tight">
            Ready to glow up?
          </h2>
          <p className="text-white/65 text-base mb-10 relative z-10 max-w-sm mx-auto leading-relaxed">
            Join 200+ happy clients. Your dream nails are one booking away.
          </p>
          <Link
            href="/book"
            className="relative z-10 inline-flex items-center gap-2 bg-white text-primary font-bold px-10 py-4 rounded-2xl hover:bg-pastel-pink transition-colors duration-200 cursor-pointer shadow-lg active:scale-[0.97] text-base"
          >
            Book My Appointment
            <Sparkles size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FOOTER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="bg-[#2A2A30] text-white">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-primary via-secondary to-primary/40" />

        <div className="max-w-6xl mx-auto px-6 pt-14 pb-10">
          {/* Main grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-white/8">

            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-serif text-2xl font-bold text-primary">GlowBook</span>
              </div>
              <p className="text-white/45 text-sm leading-relaxed max-w-[200px] mb-6">
                Premium nail artistry &amp; lash treatments in Cairo. Book in 60 seconds.
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://wa.me/201000000000"
                  className="inline-flex items-center gap-2 bg-green-600/90 hover:bg-green-500 text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-colors duration-150 cursor-pointer w-fit"
                  aria-label="Chat on WhatsApp"
                >
                  <MessageCircle size={13} aria-hidden="true" />
                  WhatsApp Us
                </a>
                <a
                  href="https://instagram.com/glowbook.eg"
                  className="inline-flex items-center gap-2 text-white/40 hover:text-primary text-xs font-medium transition-colors duration-150 cursor-pointer w-fit"
                  aria-label="Follow on Instagram"
                >
                  <AtSign size={13} aria-hidden="true" />
                  @glowbook.eg
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <p className="text-xs font-bold text-white/35 uppercase tracking-[0.12em] mb-5">Services</p>
              <ul className="space-y-2.5">
                {(services ?? []).map((s) => (
                  <li key={s.name}>
                    <Link
                      href={`/book?service=${encodeURIComponent(s.name)}`}
                      className="text-sm text-white/55 hover:text-primary transition-colors duration-150 cursor-pointer"
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Locations */}
            <div>
              <p className="text-xs font-bold text-white/35 uppercase tracking-[0.12em] mb-5">Locations</p>
              <ul className="space-y-3.5">
                <li>
                  <p className="text-sm font-semibold text-white/70">Heliopolis</p>
                  <p className="text-xs text-white/35 mt-0.5">Sat–Thu · 11 AM – 9 PM</p>
                </li>
                <li>
                  <p className="text-sm font-semibold text-white/70">New Cairo</p>
                  <p className="text-xs text-white/35 mt-0.5">Sat–Thu · 11 AM – 9 PM</p>
                </li>
              </ul>
              <div className="mt-5 flex items-center gap-2 text-white/35 text-xs">
                <MapPin size={12} className="text-primary shrink-0" aria-hidden="true" />
                Cairo, Egypt
              </div>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-xs font-bold text-white/35 uppercase tracking-[0.12em] mb-5">Quick Links</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Book Now", href: "/book" },
                  { label: "My Account", href: "/account/login" },
                  { label: "Services", href: "#services" },
                  { label: "How It Works", href: "#how" },
                  { label: "Gallery", href: "#gallery" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/55 hover:text-primary transition-colors duration-150 cursor-pointer">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
            <span>© {new Date().getFullYear()} GlowBook Egypt. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link href="/book" className="text-primary hover:text-secondary font-semibold transition-colors duration-150 cursor-pointer">
                Book an Appointment →
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MOBILE STICKY CTA
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-white/90 backdrop-blur-lg border-t border-border z-50 sm:hidden">
        <Link
          href="/book"
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl w-full shadow-lg shadow-primary/25 cursor-pointer active:scale-[0.98] transition-transform duration-150"
        >
          Book Your Appointment
          <Sparkles size={16} aria-hidden="true" />
        </Link>
      </div>

    </div>
  );
}
