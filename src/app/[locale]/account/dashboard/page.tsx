"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays, Clock, Star, LogOut, Loader2, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, RefreshCw, Sparkles, Gift, Tag,
} from "lucide-react";
import { useDictionary } from "@/lib/i18n/DictionaryContext";
import { useLocalePath, useLocale } from "@/lib/i18n/LocaleContext";

type User = { id: string; name: string; email: string; phone: string | null; points: number };
type Booking = {
  id: string; serviceType: string; bookingDate: string; bookingTime: string;
  status: string; paymentStatus: string; pointsEarned: number | null;
};
type Coupon = { id: string; code: string; discount: number; usageCount: number; maxUsage: number | null };
type CouponsData = { coupons: Coupon[]; threshold: number; pointsPerBooking: number; couponDiscount: number };

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
  const TIMES = ["11:00","12:30","14:00","15:30","17:00","18:30","20:00"];

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()),
      fetch("/api/user/bookings").then(r => r.json()),
      fetch("/api/user/coupons").then(r => r.json()),
    ]).then(([meData, bData, cData]) => {
      if (!meData.user) { window.location.href = l("/account/login"); return; }
      setUser(meData.user);
      setBookings(Array.isArray(bData) ? bData : []);
      if (cData && !cData.error) setCouponsData(cData);
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

          <div className="mt-5 bg-gradient-to-r from-primary/8 to-secondary/5 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-0.5">{t.dashboard.yourPoints}</p>
              <p className="font-serif text-3xl font-bold text-glam-text">{user.points}</p>
              <p className="text-xs text-muted mt-0.5">{t.dashboard.earnPoints}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Star size={22} className="text-primary" strokeWidth={1.5} aria-hidden="true" />
            </div>
          </div>
        </div>

        <Link href={l("/book")}
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl shadow-md shadow-primary/25 hover:bg-secondary transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <Sparkles size={16} aria-hidden="true" />
          {t.dashboard.bookNew}
        </Link>

        {/* Points & Coupons */}
        {couponsData && (
          <div className="bg-white rounded-3xl p-6 border border-border shadow-sm shadow-primary/5 space-y-4">
            <h2 className="font-serif text-base font-bold text-glam-text flex items-center gap-2">
              <Gift size={15} className="text-primary" aria-hidden="true" />
              {t.dashboard.rewards}
            </h2>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-glam-text">{t.dashboard.pointsProgress}</p>
                <p className="text-xs font-bold text-primary">{user.points} / {couponsData.threshold} pts</p>
              </div>
              <div className="h-2.5 bg-pastel-pink rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (user.points / couponsData.threshold) * 100)}%` }} />
              </div>
              <p className="text-xs text-muted mt-1.5">
                {user.points >= couponsData.threshold
                  ? t.dashboard.thresholdReached
                  : `${couponsData.threshold - user.points} ${t.dashboard.morePoints1} ${couponsData.couponDiscount}% ${t.dashboard.morePoints2} · ${couponsData.pointsPerBooking} ${t.dashboard.ptsPerBooking}`}
              </p>
            </div>

            {couponsData.coupons.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-glam-text">{t.dashboard.couponCodes}</p>
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
                      <p className="font-bold text-glam-text text-sm">{b.serviceType}</p>
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
                    <p className="text-sm font-bold text-glam-text truncate">{b.serviceType}</p>
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
