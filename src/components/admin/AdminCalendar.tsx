"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, X, Loader2, Clock } from "lucide-react";

type Props = { dayCountMap: Record<string, number>; today: string };

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

type DayBooking = { id: string; clientName: string; bookingTime: string; serviceType: string; status: string };

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  completed: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
};

export default function AdminCalendar({ dayCountMap, today }: Props) {
  const [y, m] = today.split("-").map(Number);
  const [view, setView] = useState({ y, m: m - 1 });
  const [selected, setSelected] = useState<string | null>(null);
  const [dayBookings, setDayBookings] = useState<DayBooking[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const toStr = (d: number) => `${view.y}-${String(view.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const handleDayClick = async (dateStr: string) => {
    const count = dayCountMap[dateStr] ?? 0;
    if (count === 0) { setSelected(null); return; }
    setSelected(dateStr);
    setLoadingDay(true);
    try {
      const res = await fetch(`/api/admin/bookings?date=${dateStr}`);
      const data = await res.json();
      setDayBookings(Array.isArray(data) ? data : []);
    } catch {
      setDayBookings([]);
    } finally {
      setLoadingDay(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-5">
        <button type="button" onClick={() => setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:bg-pastel-pink hover:text-primary transition-all cursor-pointer">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span className="font-serif font-bold text-glam-text">{MONTHS[view.m]} {view.y}</span>
        <button type="button" onClick={() => setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-muted hover:bg-pastel-pink hover:text-primary transition-all cursor-pointer">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <span key={d} className="text-center text-xs font-bold text-muted/50 py-1.5">{d}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDow }, (_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = toStr(day);
          const count = dayCountMap[dateStr] ?? 0;
          const isToday = dateStr === today;
          const isSelected = selected === dateStr;

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDayClick(dateStr)}
              aria-label={`${dateStr}: ${count} booking${count !== 1 ? "s" : ""}`}
              aria-pressed={isSelected}
              className={[
                "relative h-12 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all duration-150",
                isSelected ? "bg-primary text-white shadow-sm shadow-primary/30" :
                isToday ? "ring-2 ring-primary/40 text-primary font-bold" :
                count > 0 ? "bg-pastel-pink text-primary hover:bg-primary hover:text-white cursor-pointer" :
                "text-muted/40 cursor-default",
              ].filter(Boolean).join(" ")}
            >
              <span>{day}</span>
              {count > 0 && (
                <span className={`text-[9px] font-black leading-none mt-0.5 ${isSelected ? "text-white/80" : "text-primary"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-3 h-3 rounded-sm bg-pastel-pink" aria-hidden="true" />
          Has bookings
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-3 h-3 rounded-sm bg-primary" aria-hidden="true" />
          Selected
        </span>
      </div>

      {/* Day detail panel */}
      {selected && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-sm font-bold text-glam-text">
              {new Date(selected + "T00:00:00").toLocaleDateString("en-EG", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <button onClick={() => setSelected(null)} aria-label="Close"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-primary hover:bg-pastel-pink transition-all cursor-pointer">
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          {loadingDay ? (
            <div className="flex items-center justify-center gap-2 py-6 text-muted text-sm">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" /> Loading…
            </div>
          ) : (
            <div className="space-y-2">
              {dayBookings.map(b => (
                <div key={b.id} className="flex items-center gap-3 bg-background rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-1 text-xs font-bold text-primary bg-pastel-pink px-2.5 py-1 rounded-lg shrink-0">
                    <Clock size={10} aria-hidden="true" /> {b.bookingTime}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-glam-text truncate">{b.clientName}</p>
                    <p className="text-xs text-muted truncate">{b.serviceType}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_COLORS[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
