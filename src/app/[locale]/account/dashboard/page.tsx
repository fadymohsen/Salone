"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays, Clock, Star, LogOut, Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, RefreshCw, Sparkles, Tag,
} from "lucide-react";
import { useDictionary } from "@/lib/i18n/DictionaryContext";
import { useLocalePath, useLocale } from "@/lib/i18n/LocaleContext";

type User = { id: string; name: string; email: string; phone: string | null; points: number };
type Booking = {
  id: string; serviceType: string; bookingDate: string; bookingTime: string;
  status: string; paymentStatus: string; paymentMethod: string | null; pointsEarned: number | null;
};
type Coupon = { id: string; code: string; discount: number; usageCount: number; maxUsage: number | null };
type CouponsData = { coupons: Coupon[]; threshold: number; pointsPerBooking: number; couponDiscount: number; totalEarned: number; totalRedeemed: number };
type RedeemService = { id: string; name: string; nameAr: string | null; price: number; pointsPrice: number; rewardDiscount: number; duration: number; availableDays: string; timeSlots: string };

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  completed: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
};

function MiniCalendar({ value, onChange, months, dayNames }: { value: string; onChange: (d: string) => void; months: string[]; dayNames: string[] }) {
  const todayObj = new Date(); todayObj.setHours(0,0,0,0);
  const [view, setView] = useState(() => {
    if (value) { const [y,m] = value.split("-").map(Number); return { y, m: m - 1 }; }
    return { y: todayObj.getFullYear(), m: todayObj.getMonth() };
  });
  const canGoPrev = view.y > todayObj.getFullYear() || (view.y === todayObj.getFullYear() && view.m > todayObj.getMonth());
  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const toStr = (d: number) => `${view.y}-${String(view.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  return (
    <div className="bg-background border border-border rounded-2xl p-3 select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setView(v => v.m===0?{y:v.y-1,m:11}:{y:v.y,m:v.m-1})} disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-pastel-pink hover:text-primary transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer">
          <ChevronLeft size={14} aria-hidden="true" />
        </button>
        <span className="text-xs font-bold text-glam-text">{months[view.m]} {view.y}</span>
        <button type="button" onClick={() => setView(v => v.m===11?{y:v.y+1,m:0}:{y:v.y,m:v.m+1})}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-pastel-pink hover:text-primary transition-all cursor-pointer">
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map(d => <span key={d} className="text-center text-xs font-bold text-muted/50 py-1">{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({length:firstDow},(_,i)=><span key={`b${i}`}/>)}
        {Array.from({length:daysInMonth},(_,i)=>{
          const day=i+1, dateStr=toStr(day);
          const cellDate=new Date(view.y,view.m,day);
          const isPast=cellDate<todayObj, isSelected=value===dateStr;
          return (
            <button key={day} type="button" disabled={isPast} onClick={()=>!isPast&&onChange(dateStr)}
              className={`h-8 w-full rounded-lg text-xs font-semibold transition-all duration-150 ${isPast?"text-muted/25 cursor-not-allowed":"cursor-pointer"} ${isSelected?"bg-primary text-white":"text-glam-text hover:bg-pastel-pink hover:text-primary"}`}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useDictionary();
  const l = useLocalePath();
  const locale = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [couponsData, setCouponsData] = useState<CouponsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("11:00");
  const [saving, setSaving] = useState(false);
  const [redeemServices, setRedeemServices] = useState<RedeemService[]>([]);
  const [redeemId, setRedeemId] = useState<string | null>(null);
  const [redeemDate, setRedeemDate] = useState("");
  const [redeemTime, setRedeemTime] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const TIMES = ["11:00","12:30","14:00","15:30","17:00","18:30","20:00"];

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()),
      fetch("/api/user/bookings").then(r => r.json()),
      fetch("/api/user/coupons").then(r => r.json()),
      fetch("/api/services").then(r => r.json()),
    ]).then(([meData, bData, cData, svcData]) => {
      if (!meData.user) { window.location.href = l("/account/login"); return; }
      setUser(meData.user);
      setBookings(Array.isArray(bData) ? bData : []);
      if (cData && !cData.error) setCouponsData(cData);
      if (Array.isArray(svcData)) {
        setRedeemServices(svcData.filter((s: RedeemService & { pointsPrice: number | null }) => s.pointsPrice != null && s.pointsPrice > 0));
      }
    }).catch(() => { window.location.href = l("/account/login"); })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = `/${locale}`;
  };

  const handleReschedule = async (id: string) => {
    if (!newDate || !newTime) return;
    setSaving(true);
    const res = await fetch(`/api/user/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingDate: newDate, bookingTime: newTime }),
    });
    setSaving(false);
    if (res.ok) {
      setRescheduleId(null);
      const updated = await fetch("/api/user/bookings").then(r => r.json());
      setBookings(Array.isArray(updated) ? updated : []);
    } else {
      alert(t.dashboard.couldNotReschedule);
    }
  };

  const handleRedeem = async () => {
    if (!redeemId || !redeemDate || !redeemTime) return;
    setRedeeming(true);
    try {
      const res = await fetch("/api/user/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: redeemId, bookingDate: redeemDate, bookingTime: redeemTime }),
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemId(null);
        setRedeemDate("");
        setRedeemTime("");
        // Refresh data
        const [meData, bData, cData] = await Promise.all([
          fetch("/api/auth/me").then(r => r.json()),
          fetch("/api/user/bookings").then(r => r.json()),
          fetch("/api/user/coupons").then(r => r.json()),
        ]);
        if (meData.user) setUser(meData.user);
        setBookings(Array.isArray(bData) ? bData : []);
        if (cData && !cData.error) setCouponsData(cData);
      } else {
        alert(data.error || (locale === "ar" ? "حدث خطأ" : "Something went wrong"));
      }
    } catch {
      alert(locale === "ar" ? "خطأ في الاتصال" : "Connection error");
    } finally {
      setRedeeming(false);
    }
  };

  const selectedRedeemService = redeemServices.find(s => s.id === redeemId);
  const redeemAvailableDays = selectedRedeemService?.availableDays
    ? selectedRedeemService.availableDays.split(",").map(d => parseInt(d.trim(), 10)).filter(n => !isNaN(n))
    : [];
  const redeemAvailableTimes: string[] = (() => {
    if (!selectedRedeemService?.timeSlots || !redeemDate) return TIMES;
    const dow = new Date(redeemDate + "T00:00:00").getDay();
    const dur = selectedRedeemService.duration || 60;
    try {
      const parsed = JSON.parse(selectedRedeemService.timeSlots);
      if (parsed.ranges?.[String(dow)]) {
        const r = parsed.ranges[String(dow)];
        const [sh, sm] = r.start.split(":").map(Number);
        const [eh, em] = r.end.split(":").map(Number);
        const s = sh * 60 + sm, e = eh * 60 + em;
        const slots: string[] = [];
        for (let m = s; m + dur <= e; m += dur) slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
        return slots.length > 0 ? slots : TIMES;
      }
      if (parsed[String(dow)]) return parsed[String(dow)];
    } catch { /* legacy */ }
    return selectedRedeemService.timeSlots.split(",").map(t => t.trim()).filter(Boolean);
  })();

  if (loading) return (
    <div className="min-h-[calc(100dvh-56px)] flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-primary" aria-hidden="true" />
    </div>
  );

  if (!user) return null;

  const upcoming = bookings.filter(b => b.bookingDate >= new Date().toISOString().split("T")[0] && b.status === "confirmed");
  const past = bookings.filter(b => b.bookingDate < new Date().toISOString().split("T")[0] || b.status !== "confirmed");

  return (
    <div className="min-h-[calc(100dvh-56px)] pb-10">
      <div className="max-w-lg mx-auto px-6 pt-8 space-y-6">

        {/* Profile card */}
        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm shadow-primary/5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-pastel-pink flex items-center justify-center text-primary font-bold text-xl font-serif">
                {user.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-serif font-bold text-glam-text text-lg">{user.name}</p>
                <p className="text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-red-500 transition-colors duration-150 cursor-pointer font-medium">
              <LogOut size={13} aria-hidden="true" /> {t.common.signOut}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-primary/8 to-primary/3 rounded-2xl px-4 py-3.5 text-center">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">{t.dashboard.totalEarned}</p>
              <p className="font-serif text-2xl font-bold text-glam-text">{couponsData?.totalEarned ?? 0}</p>
              <p className="text-xs text-muted mt-0.5">pts</p>
            </div>
            <div className="bg-gradient-to-br from-secondary/8 to-secondary/3 rounded-2xl px-4 py-3.5 text-center">
              <p className="text-xs font-bold text-secondary uppercase tracking-wide mb-1">{t.dashboard.redeemed}</p>
              <p className="font-serif text-2xl font-bold text-glam-text">{couponsData?.totalRedeemed ?? 0}</p>
              <p className="text-xs text-muted mt-0.5">pts</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/8 to-green-500/3 rounded-2xl px-4 py-3.5 text-center">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">{t.dashboard.remaining}</p>
              <p className="font-serif text-2xl font-bold text-glam-text">{user.points}</p>
              <p className="text-xs text-muted mt-0.5">pts</p>
            </div>
          </div>
          <p className="text-xs text-muted mt-3 text-center">{t.dashboard.earnPoints}</p>
        </div>

        <Link href={l("/book")}
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <Sparkles size={16} aria-hidden="true" />
          {t.dashboard.bookNew}
        </Link>

        {/* Promo Coupons (manually created by admin for this user) */}
        {couponsData && couponsData.coupons.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-border shadow-sm shadow-primary/5 space-y-4">
            <h2 className="font-serif text-base font-bold text-glam-text flex items-center gap-2">
              <Tag size={15} className="text-primary" aria-hidden="true" />
              {t.dashboard.couponCodes}
            </h2>
            <div className="space-y-2">
              {couponsData.coupons.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-pastel-pink/40 border border-primary/15 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-primary shrink-0" aria-hidden="true" />
                    <span className="font-black text-primary tracking-wider text-sm">{c.code}</span>
                  </div>
                  <div className="text-end">
                    <p className="text-xs font-bold text-glam-text">{c.discount}% {t.dashboard.off}</p>
                    {c.maxUsage && <p className="text-xs text-muted">{c.usageCount}/{c.maxUsage} {t.dashboard.used}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Redeem with Points */}
        {redeemServices.length > 0 && user && (
          <div className="bg-white rounded-3xl p-6 border border-border shadow-sm shadow-primary/5 space-y-4">
            <h2 className="font-serif text-base font-bold text-glam-text flex items-center gap-2">
              <Star size={15} className="text-primary" aria-hidden="true" />
              {locale === "ar" ? "استبدال النقاط بخدمة" : "Redeem Points for a Service"}
            </h2>
            <p className="text-xs text-muted">{locale === "ar" ? "استخدمي نقاطك للحصول على خصم على خدمات مختارة" : "Use your points to get a discount on selected services"}</p>

            <div className="space-y-2">
              {redeemServices.map((s) => {
                const canAfford = user.points >= s.pointsPrice;
                const isSelected = redeemId === s.id;
                const discountedPrice = s.price - s.pointsPrice;
                return (
                  <button key={s.id} type="button"
                    onClick={() => { if (canAfford) { setRedeemId(isSelected ? null : s.id); setRedeemDate(""); setRedeemTime(""); } }}
                    disabled={!canAfford}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border text-start transition-all duration-150 min-h-[56px] ${
                      isSelected ? "border-primary ring-2 ring-primary/15 bg-primary/5" :
                      canAfford ? "border-border bg-background hover:border-primary/40 cursor-pointer" :
                      "border-border bg-background opacity-50 cursor-not-allowed"
                    }`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isSelected ? "text-primary" : "text-glam-text"}`}>
                        {locale === "ar" ? (s.nameAr || s.name) : s.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted line-through">{s.price} {locale === "ar" ? "ج.م" : "EGP"}</span>
                        <span className="text-xs font-bold text-green-600">{discountedPrice} {locale === "ar" ? "ج.م" : "EGP"}</span>
                        <span className="text-xs font-bold text-primary bg-pastel-pink px-1.5 py-0.5 rounded-full">-{s.rewardDiscount}%</span>
                      </div>
                      {!canAfford && (
                        <p className="text-xs text-red-400 mt-0.5">{locale === "ar" ? `تحتاجين ${s.pointsPrice - user.points} نقطة إضافية` : `Need ${s.pointsPrice - user.points} more points`}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-sm font-bold tabular-nums ${isSelected ? "text-primary" : canAfford ? "text-glam-text/70" : "text-muted"}`}>
                        {s.pointsPrice} pts
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? "border-primary bg-primary" : "border-border"}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {redeemId && selectedRedeemService && (
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-xs font-bold text-glam-text">{locale === "ar" ? "اختاري التاريخ والوقت:" : "Choose date & time:"}</p>
                <MiniCalendar value={redeemDate} onChange={setRedeemDate} months={t.booking.months} dayNames={t.booking.dayNames} />
                <div className="grid grid-cols-4 gap-1.5">
                  {redeemAvailableTimes.map(time => (
                    <button key={time} type="button" onClick={() => setRedeemTime(time)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all duration-150 cursor-pointer min-h-[40px] ${redeemTime === time ? "bg-primary text-white border-primary" : "border-border text-glam-text hover:border-primary/50 hover:text-primary"}`}>
                      {time}
                    </button>
                  ))}
                </div>
                <button onClick={handleRedeem} disabled={!redeemDate || !redeemTime || redeeming}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]">
                  {redeeming
                    ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> {locale === "ar" ? "جاري الاستبدال..." : "Redeeming..."}</>
                    : <><Star size={14} aria-hidden="true" /> {locale === "ar" ? `استبدال ${selectedRedeemService.pointsPrice} نقطة` : `Redeem ${selectedRedeemService.pointsPrice} Points`}</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upcoming */}
        <div>
          <h2 className="font-serif text-base font-bold text-glam-text mb-3 flex items-center gap-2">
            <CalendarDays size={15} className="text-primary" aria-hidden="true" />
            {t.dashboard.upcoming}
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center">
              <CalendarDays size={28} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm text-muted">{t.dashboard.noUpcoming}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-glam-text text-sm">{b.serviceType}</p>
                        {b.paymentMethod === "points" && (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                            <Star size={9} aria-hidden="true" /> {locale === "ar" ? "ولاء" : "Loyalty"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted"><CalendarDays size={11} aria-hidden="true" /> {b.bookingDate}</span>
                        <span className="flex items-center gap-1 text-xs text-muted"><Clock size={11} aria-hidden="true" /> {b.bookingTime}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                      {b.status}
                    </span>
                  </div>

                  {rescheduleId === b.id ? (
                    <div className="border-t border-border pt-3 space-y-3">
                      <p className="text-xs font-bold text-glam-text">{t.dashboard.chooseNewDateTime}</p>
                      <MiniCalendar value={newDate} onChange={setNewDate} months={t.booking.months} dayNames={t.booking.dayNames} />
                      <div className="grid grid-cols-4 gap-1.5">
                        {TIMES.map(time => (
                          <button key={time} type="button" onClick={() => setNewTime(time)}
                            className={`py-2 text-xs font-bold rounded-xl border transition-all duration-150 cursor-pointer min-h-[40px] ${newTime === time ? "bg-primary text-white border-primary" : "border-border text-glam-text hover:border-primary/50 hover:text-primary"}`}>
                            {time}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setRescheduleId(null)}
                          className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted hover:border-primary hover:text-primary transition-all duration-150 cursor-pointer">
                          {t.common.cancel}
                        </button>
                        <button onClick={() => handleReschedule(b.id)} disabled={!newDate || saving}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-secondary transition-all duration-150 disabled:opacity-50 cursor-pointer">
                          {saving ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <><RefreshCw size={12} aria-hidden="true" /> {t.common.confirm}</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setRescheduleId(b.id); setNewDate(b.bookingDate); setNewTime(b.bookingTime); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-secondary transition-colors duration-150 cursor-pointer mt-1">
                      <RefreshCw size={12} aria-hidden="true" /> {t.dashboard.reschedule}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past bookings */}
        {past.length > 0 && (
          <div>
            <h2 className="font-serif text-base font-bold text-glam-text mb-3">{t.dashboard.history}</h2>
            <div className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {past.map(b => (
                <div key={b.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="shrink-0">
                    {b.status === "completed" ? (
                      <CheckCircle2 size={16} className="text-green-500" aria-hidden="true" />
                    ) : (
                      <XCircle size={16} className="text-red-400" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-glam-text truncate">{b.serviceType}</p>
                      {b.paymentMethod === "points" && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                          <Star size={9} aria-hidden="true" /> {locale === "ar" ? "ولاء" : "Loyalty"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">{b.bookingDate} · {b.bookingTime}</p>
                  </div>
                  {b.pointsEarned && b.pointsEarned > 0 && (
                    <span className="text-xs font-bold text-primary bg-pastel-pink px-2 py-0.5 rounded-full">
                      +{b.pointsEarned} pts
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize shrink-0 ${STATUS_STYLES[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
