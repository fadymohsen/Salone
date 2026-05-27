"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Phone, Mail, ChevronLeft, ChevronRight,
  Clock, Loader2, CheckCircle2, CreditCard, Smartphone, Banknote, Tag,
} from "lucide-react";
import { useDictionary } from "@/lib/i18n/DictionaryContext";
import { useLocalePath, useLocale } from "@/lib/i18n/LocaleContext";

const INPUT_CLASS =
  "w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-sm text-glam-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-150 min-h-[48px]";

const DEFAULT_TIMES = ["11:00","12:30","14:00","15:30","17:00","18:30","20:00"];

type CategoryOption = { id: string; name: string; nameAr: string | null };
type ServiceOption = { id: string; name: string; nameAr: string | null; price: number; duration: number; availableDays: string; timeSlots: string; categoryId: string | null; category: CategoryOption | null };

function genSlots(start: string, end: string, dur: number): string[] {
  if (!start || !end || dur <= 0) return [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm, e = eh * 60 + em;
  const slots: string[] = [];
  for (let m = s; m + dur <= e; m += dur) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return slots;
}

function CalendarPicker({
  value, onChange, availableDays = [], months, dayNames,
}: {
  value: string; onChange: (d: string) => void; availableDays?: number[]; months: string[]; dayNames: string[];
}) {
  const todayObj = new Date(); todayObj.setHours(0, 0, 0, 0);

  const [view, setView] = useState<{ y: number; m: number }>(() => {
    if (value) { const [y, m] = value.split("-").map(Number); return { y, m: m - 1 }; }
    return { y: todayObj.getFullYear(), m: todayObj.getMonth() };
  });

  const canGoPrev = view.y > todayObj.getFullYear() || (view.y === todayObj.getFullYear() && view.m > todayObj.getMonth());
  const prevMonth = () => { if (!canGoPrev) return; setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }); };
  const nextMonth = () => { setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }); };

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const toStr = (day: number) => `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="bg-white border border-border rounded-2xl p-4 select-none shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} disabled={!canGoPrev} aria-label="Previous month"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:bg-pastel-pink hover:text-primary transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span className="font-serif font-bold text-glam-text text-sm">{months[view.m]} {view.y}</span>
        <button type="button" onClick={nextMonth} aria-label="Next month"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:bg-pastel-pink hover:text-primary transition-all duration-150 cursor-pointer">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map(d => <span key={d} className="text-center text-xs font-bold text-muted/50 py-1.5">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDow }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1, dateStr = toStr(day), cellDate = new Date(view.y, view.m, day);
          const isPast = cellDate < todayObj, isToday = cellDate.getTime() === todayObj.getTime(), isSelected = value === dateStr;
          const dow = cellDate.getDay(), dayDisabled = availableDays.length > 0 && !availableDays.includes(dow);
          const disabled = isPast || dayDisabled;
          return (
            <button key={day} type="button" disabled={disabled} onClick={() => !disabled && onChange(dateStr)}
              aria-label={`Select ${dateStr}`} aria-pressed={isSelected}
              className={[
                "h-9 w-full rounded-xl text-xs font-semibold transition-all duration-150 relative",
                disabled ? "text-muted/25 cursor-not-allowed" : "cursor-pointer",
                isSelected ? "bg-primary text-white shadow-sm shadow-primary/30" : isToday ? "ring-2 ring-primary/40 text-primary font-bold" : !disabled ? "text-glam-text hover:bg-pastel-pink hover:text-primary" : "",
              ].join(" ")}>
              {day}
              {isToday && !isSelected && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type PayStep = "form" | "payment" | "done";
type PayMethod = "card" | "instapay" | "vodafone";

function BookingFormContent() {
  const t = useDictionary();
  const l = useLocalePath();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({ clientName: "", clientPhone: "", clientEmail: "", serviceType: "", bookingDate: "", bookingTime: "", promoCode: "" });
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [step, setStep] = useState<PayStep>("form");
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [payConfirming, setPayConfirming] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; phone: string | null } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>(DEFAULT_TIMES);
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, svcRes, catRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/services"), fetch("/api/categories")]);
        const meData = await meRes.json();
        const svcData = await svcRes.json();
        const catData = await catRes.json();
        if (meData.user) {
          setUser(meData.user);
          setForm(prev => ({ ...prev, clientName: meData.user.name, clientPhone: meData.user.phone ?? "", clientEmail: meData.user.email }));
        }
        setServices(Array.isArray(svcData) ? svcData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      } catch {} finally { setLoadingUser(false); }
    };
    load();
  }, []);

  // Pre-select service from URL param
  useEffect(() => {
    const p = searchParams.get("service");
    if (p && services.length > 0) {
      const matched = services.find(s => s.name === p);
      if (matched) {
        setForm(prev => ({ ...prev, serviceType: p }));
        if (matched.categoryId) setSelectedCategory(matched.categoryId);
      }
    }
  }, [searchParams, services]);

  // When category changes, reset service if it doesn't belong
  useEffect(() => {
    if (!selectedCategory) return;
    const filtered = services.filter(s => s.categoryId === selectedCategory);
    if (filtered.length > 0 && !filtered.find(s => s.name === form.serviceType)) {
      setForm(prev => ({ ...prev, serviceType: filtered[0].name }));
    }
  }, [selectedCategory, services]); // eslint-disable-line react-hooks/exhaustive-deps

  const [daySlotMap, setDaySlotMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!form.serviceType || services.length === 0) return;
    const matched = services.find(s => s.name === form.serviceType);
    if (!matched) return;
    const parsedDays = matched.availableDays ? matched.availableDays.split(",").map(d => parseInt(d.trim(), 10)).filter(n => !isNaN(n)) : [];
    setAvailableDays(parsedDays);
    const dur = matched.duration || 60;

    // Parse time ranges or legacy formats
    let dsMap: Record<string, string[]> = {};
    try {
      const parsed = JSON.parse(matched.timeSlots);
      if (parsed.ranges && typeof parsed.ranges === "object") {
        // New range format: generate slots from ranges + duration
        for (const [day, range] of Object.entries(parsed.ranges as Record<string, { start: string; end: string }>)) {
          dsMap[day] = genSlots(range.start, range.end, dur);
        }
      } else if (typeof parsed === "object" && !Array.isArray(parsed)) {
        // Legacy per-day slots format
        dsMap = parsed;
      }
    } catch { /* legacy CSV */ }
    if (Object.keys(dsMap).length === 0) {
      const times = matched.timeSlots ? matched.timeSlots.split(",").map(t => t.trim()).filter(Boolean) : DEFAULT_TIMES;
      for (const d of parsedDays) dsMap[String(d)] = times;
    }
    setDaySlotMap(dsMap);

    if (form.bookingDate) {
      const dow = new Date(form.bookingDate + "T00:00:00").getDay();
      const dayTimes = dsMap[String(dow)] ?? [];
      setAvailableTimes(dayTimes);
      setForm(prev => ({ ...prev, bookingTime: dayTimes.includes(prev.bookingTime) ? prev.bookingTime : "" }));
    } else {
      const allTimes = [...new Set(Object.values(dsMap).flat())].sort();
      setAvailableTimes(allTimes.length > 0 ? allTimes : []);
    }
  }, [form.serviceType, services]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update available times when date changes
  useEffect(() => {
    if (!form.bookingDate || Object.keys(daySlotMap).length === 0) return;
    const dow = new Date(form.bookingDate + "T00:00:00").getDay();
    const dayTimes = daySlotMap[String(dow)] ?? [];
    setAvailableTimes(dayTimes);
    setForm(prev => ({ ...prev, bookingTime: dayTimes.includes(prev.bookingTime) ? prev.bookingTime : "" }));
  }, [form.bookingDate, daySlotMap]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!form.bookingDate || !form.bookingTime) return; setStep("payment"); };

  const handlePayConfirm = async () => {
    setPayConfirming(true);
    try {
      const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, promoCode: form.promoCode || undefined }) });
      if (!res.ok) { alert(t.booking.somethingWrong); setPayConfirming(false); return; }
    } catch { alert(t.booking.networkIssue); setPayConfirming(false); return; }
    setPayConfirming(false);
    setStep("done");
    setTimeout(() => router.push(`/${locale}`), 4000);
  };

  const validatePromo = async () => {
    if (!form.promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    setPromoDiscount(null);
    try {
      const res = await fetch("/api/promo/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: form.promoCode }) });
      const data = await res.json();
      if (data.valid) setPromoDiscount(data.discount);
      else setPromoError(data.error || (locale === "ar" ? "كود غير صالح" : "Invalid code"));
    } catch { setPromoError(locale === "ar" ? "خطأ في الاتصال" : "Connection error"); }
    finally { setPromoLoading(false); }
  };

  const selectedService = services.find(s => s.name === form.serviceType);
  const filteredServices = selectedCategory ? services.filter(s => s.categoryId === selectedCategory) : services;
  const displayName = (s: ServiceOption) => locale === "ar" ? (s.nameAr || s.name) : s.name;
  const displayCatName = (c: CategoryOption) => locale === "ar" ? (c.nameAr || c.name) : c.name;

  const INSTAPAY_ID = process.env.NEXT_PUBLIC_INSTAPAY_IDENTIFIER ?? "glowbook@instapay";
  const VC_NUMBER = process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER ?? "010XXXXXXXX";

  if (step === "payment") {
    const methods: { id: PayMethod; label: string; Icon: React.ElementType; desc: string }[] = [
      { id: "card", label: t.booking.creditCard, Icon: CreditCard, desc: t.booking.creditCardDesc },
      { id: "instapay", label: t.booking.instapay, Icon: Smartphone, desc: `${t.booking.instapayDesc1.replace(":", "")} ${INSTAPAY_ID}` },
      { id: "vodafone", label: t.booking.vodafoneCash, Icon: Banknote, desc: `${t.booking.vodafoneDesc1.replace(":", "")} ${VC_NUMBER}` },
    ];

    const price = selectedService?.price ?? 0;
    const finalPrice = promoDiscount ? Math.max(0, price - Math.round(price * promoDiscount / 100)) : price;

    return (
      <div className="min-h-screen bg-background pb-10">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-md mx-auto px-6 h-14 flex items-center gap-3">
            <button onClick={() => setStep("form")} aria-label={t.common.back}
              className="w-9 h-9 rounded-xl bg-pastel-pink flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer">
              <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            <span className="font-serif font-bold text-glam-text">{t.booking.choosePayment}</span>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 pt-8 space-y-4">
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
            <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">{t.booking.yourBooking}</p>
            <p className="font-bold text-glam-text">{selectedService ? displayName(selectedService) : form.serviceType}</p>
            <p className="text-sm text-muted">{form.bookingDate} · {form.bookingTime} · {form.clientName}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-primary">{finalPrice} {t.common.egp}</span>
              {promoDiscount && price !== finalPrice && (
                <span className="text-xs text-muted line-through">{price} {t.common.egp}</span>
              )}
              {promoDiscount && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">-{promoDiscount}%</span>
              )}
            </div>
          </div>

          <p className="text-sm font-bold text-glam-text px-1">{t.booking.howToPay}</p>

          <div className="space-y-3">
            {methods.map(({ id, label, Icon, desc }) => (
              <button key={id} type="button" onClick={() => setPayMethod(id)}
                className={`w-full flex items-center gap-4 bg-white rounded-2xl border p-4 text-start transition-all duration-150 cursor-pointer ${payMethod === id ? "border-primary ring-2 ring-primary/15 shadow-sm" : "border-border hover:border-primary/40"}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${payMethod === id ? "bg-primary" : "bg-pastel-pink"}`}>
                  <Icon size={20} className={payMethod === id ? "text-white" : "text-primary"} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-glam-text">{label}</p>
                  <p className="text-xs text-muted mt-0.5">{desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${payMethod === id ? "border-primary bg-primary" : "border-border"}`}>
                  {payMethod === id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          {payMethod === "instapay" && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-2">
              <p className="text-sm font-bold text-blue-700">{t.booking.instapayTitle}</p>
              <p className="text-sm text-blue-600">{t.booking.instapayDesc1}</p>
              <p className="font-black text-blue-800 text-lg tracking-wide">{INSTAPAY_ID}</p>
              <p className="text-xs text-blue-500">{t.booking.instapayDesc2}</p>
            </div>
          )}
          {payMethod === "vodafone" && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-2">
              <p className="text-sm font-bold text-red-700">{t.booking.vodafoneTitle}</p>
              <p className="text-sm text-red-600">{t.booking.vodafoneDesc1}</p>
              <p className="font-black text-red-800 text-lg tracking-wide">{VC_NUMBER}</p>
              <p className="text-xs text-red-400">{t.booking.vodafoneDesc2}</p>
            </div>
          )}
          {payMethod === "card" && (
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-bold text-primary">{t.booking.cardTitle}</p>
              <p className="text-sm text-muted">{t.booking.cardDesc}</p>
              <div className="flex items-center gap-2 text-xs text-muted">
                <CheckCircle2 size={13} className="text-green-500" aria-hidden="true" />
                {t.booking.cardSecured}
              </div>
            </div>
          )}

          <button disabled={!payMethod || payConfirming} onClick={handlePayConfirm}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed min-h-[52px] cursor-pointer active:scale-[0.98]">
            {payConfirming ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> {t.booking.processing}</> : payMethod === "card" ? t.booking.proceedCard : t.booking.confirmPayment}
          </button>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={40} className="text-green-500" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-glam-text mb-2">{t.booking.booked}</h2>
          <p className="text-sm text-muted">{t.booking.bookedDesc}</p>
          <p className="text-xs text-muted/60 mt-3">{t.booking.redirecting}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-md mx-auto px-6 h-14 flex items-center gap-3">
          <Link href={`/${locale}`} aria-label={t.common.back}
            className="w-9 h-9 rounded-xl bg-pastel-pink flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer">
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
          <span className="font-serif font-bold text-glam-text">{t.booking.headerTitle}</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-8">
        {!user && !loadingUser && (
          <div className="mb-4 bg-pastel-pink/50 border border-primary/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-glam-text" dangerouslySetInnerHTML={{ __html: t.booking.signInBanner }} />
            <Link href={l("/account/login")} className="text-xs font-bold text-primary hover:text-secondary cursor-pointer whitespace-nowrap">
              {t.booking.signInLink}
            </Link>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm shadow-primary/5">
          <p className="text-xs text-muted text-center mb-6">{t.booking.formHint}</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Personal info */}
            <div>
              <label htmlFor="clientName" className="block text-xs font-semibold text-glam-text mb-1.5">
                {t.booking.fullName} <span className="text-primary" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input id="clientName" type="text" required autoComplete="name" value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className={`${INPUT_CLASS} ps-10`} placeholder={t.booking.namePlaceholder} />
              </div>
            </div>

            <div>
              <label htmlFor="clientPhone" className="block text-xs font-semibold text-glam-text mb-1.5">
                {t.booking.whatsappPhone} <span className="text-primary" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input id="clientPhone" type="tel" required autoComplete="tel" value={form.clientPhone}
                  onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                  className={`${INPUT_CLASS} ps-10`} placeholder={t.booking.phonePlaceholder} />
              </div>
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-xs font-semibold text-glam-text mb-1.5">
                {t.common.email} <span className="text-muted font-normal">({t.common.optional})</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input id="clientEmail" type="email" autoComplete="email" value={form.clientEmail}
                  onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                  className={`${INPUT_CLASS} ps-10`} placeholder={t.booking.emailPlaceholder} />
              </div>
            </div>

            {/* Category picker */}
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-glam-text mb-2">{t.booking.category ?? (locale === "ar" ? "الفئة" : "Category")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((c) => {
                    const isSelected = selectedCategory === c.id;
                    return (
                      <button key={c.id} type="button" onClick={() => setSelectedCategory(c.id)}
                        className={`py-3 px-3 text-sm font-semibold rounded-2xl border text-center transition-all duration-150 cursor-pointer min-h-[48px] ${
                          isSelected ? "bg-primary text-white border-primary shadow-md shadow-primary/25" : "bg-background text-glam-text border-border hover:border-primary/50 hover:text-primary"
                        }`}>
                        {displayCatName(c)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Service picker with pricing */}
            <div>
              <label className="block text-xs font-semibold text-glam-text mb-2">{t.booking.service} <span className="text-primary" aria-hidden="true">*</span></label>
              {filteredServices.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">{t.booking.loadingServices}</p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {filteredServices.map((s) => {
                    const isSelected = form.serviceType === s.name;
                    return (
                      <button key={s.id} type="button" onClick={() => setForm({ ...form, serviceType: s.name })}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-start transition-all duration-150 cursor-pointer min-h-[52px] ${
                          isSelected ? "border-primary ring-2 ring-primary/15 bg-primary/5 shadow-sm" : "border-border bg-background hover:border-primary/40"
                        }`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${isSelected ? "text-primary" : "text-glam-text"}`}>{displayName(s)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-sm font-bold tabular-nums ${isSelected ? "text-primary" : "text-glam-text/70"}`}>{s.price} {t.common.egp}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-primary bg-primary" : "border-border"}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Promo Code */}
            <div>
              <label className="block text-xs font-semibold text-glam-text mb-1.5">
                {t.booking.promoCode ?? (locale === "ar" ? "كود الخصم" : "Promo Code")} <span className="text-muted font-normal">({t.common.optional})</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                  <input type="text" value={form.promoCode}
                    onChange={(e) => { setForm({ ...form, promoCode: e.target.value.toUpperCase() }); setPromoDiscount(null); setPromoError(""); }}
                    className={`${INPUT_CLASS} ps-10 uppercase`} placeholder={locale === "ar" ? "أدخل الكود" : "Enter code"} />
                </div>
                <button type="button" onClick={validatePromo} disabled={!form.promoCode.trim() || promoLoading}
                  className="px-4 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-secondary transition-all duration-150 disabled:opacity-40 cursor-pointer min-h-[48px]">
                  {promoLoading ? <Loader2 size={14} className="animate-spin" /> : (locale === "ar" ? "تطبيق" : "Apply")}
                </button>
              </div>
              {promoDiscount && (
                <p className="text-xs font-bold text-green-600 mt-1.5 ps-1">
                  <CheckCircle2 size={12} className="inline -mt-0.5 me-1" />{locale === "ar" ? `خصم ${promoDiscount}% مطبق!` : `${promoDiscount}% discount applied!`}
                </p>
              )}
              {promoError && <p className="text-xs text-red-500 mt-1.5 ps-1">{promoError}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-glam-text mb-1.5">
                {t.booking.date} <span className="text-primary" aria-hidden="true">*</span>
              </label>
              <CalendarPicker value={form.bookingDate} onChange={(d) => setForm({ ...form, bookingDate: d })}
                availableDays={availableDays} months={t.booking.months} dayNames={t.booking.dayNames} />
              {form.bookingDate && (
                <p className="text-xs text-primary font-semibold mt-2 ps-1">
                  {t.booking.selected}: {new Date(form.bookingDate + "T00:00:00").toLocaleDateString(locale === "ar" ? "ar-EG" : "en-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>

            {/* Time */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Clock size={13} className="text-muted" aria-hidden="true" />
                <label className="text-xs font-semibold text-glam-text">
                  {t.booking.preferredTime} <span className="text-primary" aria-hidden="true">*</span>
                </label>
              </div>
              <div className="grid grid-cols-4 gap-2" role="group" aria-label={t.booking.preferredTime}>
                {availableTimes.map((time) => {
                  const isSelected = form.bookingTime === time;
                  return (
                    <button key={time} type="button" onClick={() => setForm({ ...form, bookingTime: time })}
                      aria-pressed={isSelected}
                      className={`py-3 text-xs font-semibold rounded-xl border text-center transition-all duration-150 cursor-pointer min-h-[44px] ${
                        isSelected ? "bg-primary text-white border-primary shadow-md shadow-primary/25" : "bg-background text-glam-text border-border hover:border-primary/50 hover:text-primary"
                      }`}>
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            {selectedService && form.bookingDate && form.bookingTime && (
              <div className="bg-pastel-pink/40 rounded-2xl p-4 border border-primary/10">
                <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">{t.booking.yourBooking}</p>
                <p className="font-bold text-sm text-glam-text">{displayName(selectedService)}</p>
                <p className="text-xs text-muted mt-0.5">{form.bookingDate} · {form.bookingTime}</p>
                <div className="flex items-center gap-2 mt-2">
                  {promoDiscount ? (
                    <>
                      <span className="text-sm font-bold text-primary">{Math.max(0, selectedService.price - Math.round(selectedService.price * promoDiscount / 100))} {t.common.egp}</span>
                      <span className="text-xs text-muted line-through">{selectedService.price} {t.common.egp}</span>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">-{promoDiscount}%</span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-primary">{selectedService.price} {t.common.egp}</span>
                  )}
                </div>
              </div>
            )}

            <button type="submit" disabled={!form.bookingDate || !form.bookingTime || !form.serviceType}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 min-h-[52px] cursor-pointer active:scale-[0.98]">
              {t.booking.nextPayment}
              <CreditCard size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const t = useDictionary();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          {t.common.loading}
        </div>
      </div>
    }>
      <BookingFormContent />
    </Suspense>
  );
}
