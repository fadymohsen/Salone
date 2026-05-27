"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User, Phone, Mail, ChevronDown, ChevronLeft, ChevronRight,
  Clock, Loader2, CheckCircle2, CreditCard, Smartphone, Banknote,
} from "lucide-react";

const INPUT_CLASS =
  "w-full bg-background border border-border rounded-2xl px-4 py-3.5 text-sm text-glam-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-150 min-h-[48px]";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const DEFAULT_TIMES = ["11:00","12:30","14:00","15:30","17:00","18:30","20:00"];

type ServiceOption = { id: string; name: string; price: number; availableDays: string; timeSlots: string };

function CalendarPicker({
  value,
  onChange,
  availableDays = [],
}: {
  value: string;
  onChange: (d: string) => void;
  availableDays?: number[];
}) {
  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);

  const [view, setView] = useState<{ y: number; m: number }>(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      return { y, m: m - 1 };
    }
    return { y: todayObj.getFullYear(), m: todayObj.getMonth() };
  });

  const canGoPrev =
    view.y > todayObj.getFullYear() ||
    (view.y === todayObj.getFullYear() && view.m > todayObj.getMonth());

  const prevMonth = () => {
    if (!canGoPrev) return;
    setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 });
  };
  const nextMonth = () => {
    setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 });
  };

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const toStr = (day: number) =>
    `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="bg-white border border-border rounded-2xl p-4 select-none shadow-sm">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:bg-pastel-pink hover:text-primary transition-all duration-150 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span className="font-serif font-bold text-glam-text text-sm">
          {MONTHS[view.m]} {view.y}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:bg-pastel-pink hover:text-primary transition-all duration-150 cursor-pointer"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <span key={d} className="text-center text-xs font-bold text-muted/50 py-1.5">
            {d}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDow }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = toStr(day);
          const cellDate = new Date(view.y, view.m, day);
          const isPast = cellDate < todayObj;
          const isToday = cellDate.getTime() === todayObj.getTime();
          const isSelected = value === dateStr;
          const dow = cellDate.getDay();
          const dayDisabled = availableDays.length > 0 && !availableDays.includes(dow);
          const disabled = isPast || dayDisabled;

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(dateStr)}
              aria-label={`Select ${dateStr}`}
              aria-pressed={isSelected}
              className={[
                "h-9 w-full rounded-xl text-xs font-semibold transition-all duration-150 relative",
                disabled ? "text-muted/25 cursor-not-allowed" : "cursor-pointer",
                isSelected
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : isToday
                  ? "ring-2 ring-primary/40 text-primary font-bold"
                  : !disabled
                  ? "text-glam-text hover:bg-pastel-pink hover:text-primary"
                  : "",
              ].join(" ")}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" aria-hidden="true" />
              )}
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    serviceType: "",
    bookingDate: "",
    bookingTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<PayStep>("form");
  const [payMethod, setPayMethod] = useState<PayMethod | null>(null);
  const [payConfirming, setPayConfirming] = useState(false);

  const [user, setUser] = useState<{ name: string; email: string; phone: string | null } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>(DEFAULT_TIMES);

  // Fetch user + services on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, svcRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/services"),
        ]);
        const meData = await meRes.json();
        const svcData = await svcRes.json();

        if (meData.user) {
          setUser(meData.user);
          setForm(prev => ({
            ...prev,
            clientName: meData.user.name,
            clientPhone: meData.user.phone ?? "",
            clientEmail: meData.user.email,
          }));
        }
        setServices(Array.isArray(svcData) ? svcData : []);
      } catch {
        // silently fail — form still usable without prefill or dynamic services
      } finally {
        setLoadingUser(false);
      }
    };
    load();
  }, []);

  // Apply service param from URL once services are loaded
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam) {
      setForm(prev => ({ ...prev, serviceType: serviceParam }));
    }
  }, [searchParams]);

  // Set default serviceType once services load (if none set yet)
  useEffect(() => {
    if (services.length > 0 && !form.serviceType) {
      setForm(prev => ({ ...prev, serviceType: services[0].name }));
    }
  }, [services]); // eslint-disable-line react-hooks/exhaustive-deps

  // When serviceType changes, update availableDays and availableTimes
  useEffect(() => {
    if (!form.serviceType || services.length === 0) return;

    const matched = services.find(s => s.name === form.serviceType);
    if (!matched) return;

    const parsedDays = matched.availableDays
      ? matched.availableDays.split(",").map(d => parseInt(d.trim(), 10)).filter(n => !isNaN(n))
      : [];

    const parsedTimes = matched.timeSlots
      ? matched.timeSlots.split(",").map(t => t.trim()).filter(Boolean)
      : DEFAULT_TIMES;

    setAvailableDays(parsedDays);
    setAvailableTimes(parsedTimes);

    // Clear bookingTime if it's no longer in the new time list
    setForm(prev => ({
      ...prev,
      bookingTime: parsedTimes.includes(prev.bookingTime) ? prev.bookingTime : "",
    }));
  }, [form.serviceType, services]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bookingDate || !form.bookingTime) return;
    setStep("payment");
  };

  const handlePayConfirm = async () => {
    setPayConfirming(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        alert("Something went wrong. Please try again.");
        setPayConfirming(false);
        return;
      }
    } catch {
      alert("Network issue. Please check your connection.");
      setPayConfirming(false);
      return;
    }
    setPayConfirming(false);
    setStep("done");
    setTimeout(() => router.push("/"), 4000);
  };

  // Payment step
  if (step === "payment") {
    const INSTAPAY_ID = process.env.NEXT_PUBLIC_INSTAPAY_IDENTIFIER ?? "glowbook@instapay";
    const VC_NUMBER = process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER ?? "010XXXXXXXX";

    const methods: { id: PayMethod; label: string; Icon: React.ElementType; desc: string }[] = [
      { id: "card", label: "Credit / Debit Card", Icon: CreditCard, desc: "Secure online payment via Fawaterak" },
      { id: "instapay", label: "InstaPay", Icon: Smartphone, desc: `Transfer to ${INSTAPAY_ID}` },
      { id: "vodafone", label: "Vodafone Cash", Icon: Banknote, desc: `Send to ${VC_NUMBER}` },
    ];

    return (
      <div className="min-h-screen bg-background pb-10">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border">
          <div className="max-w-md mx-auto px-6 h-14 flex items-center gap-3">
            <button onClick={() => setStep("form")} aria-label="Go back"
              className="w-9 h-9 rounded-xl bg-pastel-pink flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer">
              <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            <span className="font-serif font-bold text-glam-text">Choose Payment</span>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 pt-8 space-y-4">
          <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
            <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">Your booking</p>
            <p className="font-bold text-glam-text">{form.serviceType}</p>
            <p className="text-sm text-muted">{form.bookingDate} · {form.bookingTime} · {form.clientName}</p>
          </div>

          <p className="text-sm font-bold text-glam-text px-1">How would you like to pay?</p>

          <div className="space-y-3">
            {methods.map(({ id, label, Icon, desc }) => (
              <button key={id} type="button" onClick={() => setPayMethod(id)}
                className={`w-full flex items-center gap-4 bg-white rounded-2xl border p-4 text-left transition-all duration-150 cursor-pointer ${payMethod === id ? "border-primary ring-2 ring-primary/15 shadow-sm" : "border-border hover:border-primary/40"}`}>
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

          {/* Payment details */}
          {payMethod === "instapay" && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-2">
              <p className="text-sm font-bold text-blue-700">InstaPay Instructions</p>
              <p className="text-sm text-blue-600">Send your payment to:</p>
              <p className="font-black text-blue-800 text-lg tracking-wide">{INSTAPAY_ID}</p>
              <p className="text-xs text-blue-500">Include your name in the transfer note. Tap &ldquo;Confirm Payment&rdquo; after sending.</p>
            </div>
          )}
          {payMethod === "vodafone" && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-2">
              <p className="text-sm font-bold text-red-700">Vodafone Cash Instructions</p>
              <p className="text-sm text-red-600">Send your payment to:</p>
              <p className="font-black text-red-800 text-lg tracking-wide">{VC_NUMBER}</p>
              <p className="text-xs text-red-400">Include your name in the transfer note. Tap &ldquo;Confirm Payment&rdquo; after sending.</p>
            </div>
          )}
          {payMethod === "card" && (
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-bold text-primary">Card Payment</p>
              <p className="text-sm text-muted">You will be redirected to the Fawaterak secure payment gateway to complete your card payment.</p>
              <div className="flex items-center gap-2 text-xs text-muted">
                <CheckCircle2 size={13} className="text-green-500" aria-hidden="true" />
                Secured by Fawaterak · All major cards accepted
              </div>
            </div>
          )}

          <button
            disabled={!payMethod || payConfirming}
            onClick={handlePayConfirm}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed min-h-[52px] cursor-pointer active:scale-[0.98]">
            {payConfirming ? (
              <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Processing…</>
            ) : payMethod === "card" ? "Proceed to Card Payment" : "Confirm Payment"}
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
          <h2 className="font-serif text-2xl font-bold text-glam-text mb-2">You&rsquo;re booked!</h2>
          <p className="text-sm text-muted">Your spot is confirmed. See you soon!</p>
          <p className="text-xs text-muted/60 mt-3">Redirecting to home…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-md mx-auto px-6 h-14 flex items-center gap-3">
          <Link
            href="/"
            aria-label="Go back"
            className="w-9 h-9 rounded-xl bg-pastel-pink flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors duration-150 cursor-pointer"
          >
            <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
          <span className="font-serif font-bold text-glam-text">Reserve Your Spot</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-8">
        {/* Sign-in banner */}
        {!user && !loadingUser && (
          <div className="mb-4 bg-pastel-pink/50 border border-primary/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-glam-text">
              Have an account? <strong>Sign in</strong> to auto-fill your details.
            </p>
            <Link
              href="/account/login"
              className="text-xs font-bold text-primary hover:text-secondary cursor-pointer whitespace-nowrap"
            >
              Sign In →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm shadow-primary/5">
          <p className="text-xs text-muted text-center mb-6">Fill in your details — takes under 60 seconds.</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label htmlFor="clientName" className="block text-xs font-semibold text-glam-text mb-1.5">
                Full Name <span className="text-primary" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input
                  id="clientName"
                  type="text"
                  required
                  autoComplete="name"
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className={`${INPUT_CLASS} pl-10`}
                  placeholder="e.g., Farida Amin"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="clientPhone" className="block text-xs font-semibold text-glam-text mb-1.5">
                WhatsApp / Phone <span className="text-primary" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input
                  id="clientPhone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={form.clientPhone}
                  onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                  className={`${INPUT_CLASS} pl-10`}
                  placeholder="010XXXXXXXX"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="clientEmail" className="block text-xs font-semibold text-glam-text mb-1.5">
                Email <span className="text-muted font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
                <input
                  id="clientEmail"
                  type="email"
                  autoComplete="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                  className={`${INPUT_CLASS} pl-10`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Service */}
            <div>
              <label htmlFor="serviceType" className="block text-xs font-semibold text-glam-text mb-1.5">
                Service
              </label>
              <div className="relative">
                <select
                  id="serviceType"
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                  disabled={services.length === 0}
                  className={`${INPUT_CLASS} pr-10 cursor-pointer appearance-none disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {services.length === 0 ? (
                    <option value="">Loading services…</option>
                  ) : (
                    [...services]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))
                  )}
                </select>
                <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" aria-hidden="true" />
              </div>
            </div>

            {/* Custom Calendar */}
            <div>
              <label className="block text-xs font-semibold text-glam-text mb-1.5">
                Date <span className="text-primary" aria-hidden="true">*</span>
              </label>
              <CalendarPicker
                value={form.bookingDate}
                onChange={(d) => setForm({ ...form, bookingDate: d })}
                availableDays={availableDays}
              />
              {form.bookingDate && (
                <p className="text-xs text-primary font-semibold mt-2 pl-1">
                  Selected: {new Date(form.bookingDate + "T00:00:00").toLocaleDateString("en-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>

            {/* Time grid */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Clock size={13} className="text-muted" aria-hidden="true" />
                <label className="text-xs font-semibold text-glam-text">
                  Preferred Time <span className="text-primary" aria-hidden="true">*</span>
                </label>
              </div>
              <div className="grid grid-cols-4 gap-2" role="group" aria-label="Select appointment time">
                {availableTimes.map((time) => {
                  const isSelected = form.bookingTime === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setForm({ ...form, bookingTime: time })}
                      aria-pressed={isSelected}
                      className={`py-3 text-xs font-semibold rounded-xl border text-center transition-all duration-150 cursor-pointer min-h-[44px] ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                          : "bg-background text-glam-text border-border hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!form.bookingDate || !form.bookingTime}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2 min-h-[52px] cursor-pointer active:scale-[0.98]"
            >
              Next: Choose Payment
              <CreditCard size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          Loading…
        </div>
      </div>
    }>
      <BookingFormContent />
    </Suspense>
  );
}
