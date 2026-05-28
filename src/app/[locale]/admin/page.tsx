import { prisma } from "@/lib/db";
import Link from "next/link";
import AdminCalendar from "@/components/admin/AdminCalendar";
import SendScheduleBtn from "@/components/admin/SendScheduleBtn";
import { CalendarCheck, CalendarClock, TrendingUp, Users, ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle, CalendarDays } from "lucide-react";
import { fmt12 } from "@/lib/fmt12";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  booked: "bg-amber-50 text-amber-600 border-amber-100",
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  completed: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
  missed: "bg-orange-50 text-orange-500 border-orange-100",
};

const STATUS_META: Record<string, { dot: string; Icon: React.ElementType }> = {
  booked: { dot: "bg-amber-400", Icon: Clock },
  confirmed: { dot: "bg-blue-400", Icon: CheckCircle2 },
  completed: { dot: "bg-green-400", Icon: CheckCircle2 },
  cancelled: { dot: "bg-red-300", Icon: XCircle },
  missed: { dot: "bg-orange-400", Icon: AlertCircle },
};

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getDictionary(locale as Locale);
  const d = t.admin.dashboardPage;
  const a = t.admin.analyticsPage;

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";

  let todayBookings: Awaited<ReturnType<typeof prisma.booking.findMany>> = [];
  let tomorrowCount = 0, monthCount = 0, totalCount = 0;
  let recentBookings: Awaited<ReturnType<typeof prisma.booking.findMany>> = [];
  let allBookings: { bookingDate: string; id: string; serviceType: string; status: string; clientPhone: string }[] = [];
  let uniqueClients = 0;

  try {
    [todayBookings, tomorrowCount, monthCount, totalCount, recentBookings, allBookings] =
      await Promise.all([
        prisma.booking.findMany({ where: { bookingDate: today }, orderBy: { bookingTime: "asc" } }),
        prisma.booking.count({ where: { bookingDate: tomorrow } }),
        prisma.booking.count({ where: { bookingDate: { gte: monthStart } } }),
        prisma.booking.count(),
        prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.booking.findMany({ select: { bookingDate: true, id: true, serviceType: true, status: true, clientPhone: true }, orderBy: { bookingDate: "asc" } }),
      ]);
    uniqueClients = new Set(allBookings.map(b => b.clientPhone)).size;
  } catch {}

  const dayCountMap: Record<string, number> = {};
  for (const b of allBookings) { dayCountMap[b.bookingDate] = (dayCountMap[b.bookingDate] ?? 0) + 1; }

  // Analytics data
  const serviceMap: Record<string, number> = {};
  for (const b of allBookings) { serviceMap[b.serviceType] = (serviceMap[b.serviceType] ?? 0) + 1; }
  const topServices = Object.entries(serviceMap).sort((x, y) => y[1] - x[1]);
  const maxService = topServices[0]?.[1] ?? 1;

  const statusMap: Record<string, number> = {};
  for (const b of allBookings) { statusMap[b.status] = (statusMap[b.status] ?? 0) + 1; }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0];
    return { date: dt, label: dt.slice(5), count: allBookings.filter(b => b.bookingDate === dt).length };
  });
  const maxDay = Math.max(...last7.map(x => x.count), 1);

  const stats = [
    { label: d.today, value: todayBookings.length, sub: d.appointments, Icon: CalendarCheck, color: "text-primary" },
    { label: d.tomorrow, value: tomorrowCount, sub: d.scheduled, Icon: CalendarClock, color: "text-blue-500" },
    { label: d.thisMonth, value: monthCount, sub: d.bookings, Icon: TrendingUp, color: "text-green-500" },
    { label: a.totalBookings, value: totalCount, sub: `${uniqueClients} ${a.uniqueClients?.toLowerCase?.() ?? "clients"}`, Icon: Users, color: "text-violet-500" },
  ];

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-glam-text">{d.title}</h1>
        <p className="text-sm text-muted mt-0.5">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub, Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200">
            <div className="flex items-start justify-between mb-2">
              <p className="font-serif text-3xl font-bold text-primary">{value}</p>
              <Icon size={16} className={`${color} opacity-70 mt-1`} strokeWidth={2} aria-hidden="true" />
            </div>
            <p className="text-xs font-bold text-glam-text">{label}</p>
            <p className="text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Last 7 Days Chart */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-serif text-sm font-bold text-glam-text mb-6">{a.last7Days}</h2>
        <div className="flex items-end gap-2 h-32">
          {last7.map(x => (
            <div key={x.date} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150 min-h-[16px]">{x.count || ""}</span>
              <div className="w-full relative flex items-end" style={{ height: "88px" }}>
                <div className="w-full bg-primary rounded-t-lg transition-all duration-500" style={{ height: `${(x.count / maxDay) * 88}px`, minHeight: x.count ? "6px" : "2px", opacity: x.count ? 1 : 0.12 }} />
              </div>
              <span className="text-xs text-muted font-medium">{x.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Schedule — full width */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-sm font-bold text-glam-text">{d.todaySchedule}</h2>
          <Link href={`/${locale}/admin/orders`} className="flex items-center gap-1 text-xs font-bold text-primary hover:text-secondary transition-colors duration-150 cursor-pointer">
            {d.viewAll} <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>
        {todayBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <CalendarCheck size={32} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm text-muted">{d.noAppointmentsToday}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.map(b => (
              <div key={b.id} className="bg-white rounded-2xl border border-border p-4 hover:border-primary/30 transition-colors duration-150">
                {/* Desktop */}
                <div className="hidden md:flex items-center gap-4">
                  <span className="bg-pastel-pink text-primary font-bold text-sm rounded-xl px-3 py-1.5 shrink-0 flex items-center gap-1.5">
                    <Clock size={12} aria-hidden="true" /> {fmt12(b.bookingTime)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-glam-text text-sm truncate">{b.clientName}</p>
                    <p className="text-xs text-muted">{b.serviceType}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>{b.status}</span>
                </div>
                {/* Mobile */}
                <div className="md:hidden space-y-1.5">
                  <p className="font-bold text-glam-text text-sm">{b.clientName}</p>
                  <p className="text-xs text-muted">{b.serviceType}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="bg-pastel-pink text-primary font-bold text-xs rounded-lg px-2.5 py-1 flex items-center gap-1">
                      <Clock size={10} aria-hidden="true" /> {fmt12(b.bookingTime)}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>{b.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Services — full width */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-serif text-sm font-bold text-glam-text mb-5">{a.topServices}</h2>
        {topServices.length === 0 ? (
          <p className="text-sm text-muted">{a.noData}</p>
        ) : (
          <div className="space-y-4">
            {topServices.slice(0, 5).map(([service, count], i) => (
              <div key={service}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-bold text-glam-text flex items-center gap-1.5">
                    {i === 0 && <span className="text-primary text-xs font-black">#1</span>}
                    {service}
                  </span>
                  <span className="text-sm font-bold text-primary tabular-nums">{count}</span>
                </div>
                <div className="h-2 bg-pastel-pink rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${(count / maxService) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Status — full width */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-serif text-sm font-bold text-glam-text mb-5">{a.bookingStatus}</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusMap).map(([status, count]) => {
            const meta = STATUS_META[status];
            return (
              <div key={status} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${STATUS_COLORS[status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${meta?.dot ?? "bg-gray-300"}`} aria-hidden="true" />
                <span className="text-sm font-bold capitalize">{status}</span>
                <span className="text-sm font-black ms-1">{count}</span>
              </div>
            );
          })}
          {Object.keys(statusMap).length === 0 && <p className="text-sm text-muted">{a.noData}</p>}
        </div>
      </div>

      {/* Monthly Calendar — full width */}
      <div>
        <h2 className="font-serif text-sm font-bold text-glam-text mb-3">{d.monthlyOverview}</h2>
        <AdminCalendar dayCountMap={dayCountMap} today={today} />
      </div>

      {/* Recently Added */}
      <div>
        <h2 className="font-serif text-sm font-bold text-glam-text mb-3">{d.recentlyAdded}</h2>
        <div className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {recentBookings.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted">{d.noBookingsYet}</div>
          ) : recentBookings.map(b => (
            <div key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-pastel-pink/30 transition-colors duration-150">
              <div className="w-8 h-8 rounded-full bg-pastel-pink flex items-center justify-center text-primary font-bold text-sm shrink-0">{b.clientName[0].toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-glam-text truncate">{b.clientName}</p>
                <p className="text-xs text-muted">{b.serviceType} · {b.bookingDate}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>{b.status}</span>
            </div>
          ))}
        </div>
      </div>

      <SendScheduleBtn tomorrowDate={tomorrow} />
    </div>
  );
}
