import { prisma } from "@/lib/db";
import Link from "next/link";
import AdminCalendar from "@/components/admin/AdminCalendar";
import SendScheduleBtn from "@/components/admin/SendScheduleBtn";
import { CalendarCheck, CalendarClock, TrendingUp, Users, ArrowRight, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  completed: "bg-green-50 text-green-600 border-green-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
};

export default async function AdminDashboard() {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";

  let todayBookings: Awaited<ReturnType<typeof prisma.booking.findMany>> = [];
  let tomorrowCount = 0, monthCount = 0, totalCount = 0;
  let recentBookings: Awaited<ReturnType<typeof prisma.booking.findMany>> = [];
  let allBookings: { bookingDate: string; id: string }[] = [];

  try {
    [todayBookings, tomorrowCount, monthCount, totalCount, recentBookings, allBookings] =
      await Promise.all([
        prisma.booking.findMany({
          where: { bookingDate: today },
          orderBy: { bookingTime: "asc" },
        }),
        prisma.booking.count({ where: { bookingDate: tomorrow } }),
        prisma.booking.count({ where: { bookingDate: { gte: monthStart } } }),
        prisma.booking.count(),
        prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.booking.findMany({ select: { bookingDate: true, id: true }, orderBy: { bookingDate: "asc" } }),
      ]);
  } catch {
    // DB not available
  }

  // Build day-count map for the calendar
  const dayCountMap: Record<string, number> = {};
  for (const b of allBookings) {
    dayCountMap[b.bookingDate] = (dayCountMap[b.bookingDate] ?? 0) + 1;
  }

  const stats = [
    { label: "Today", value: todayBookings.length, sub: "appointments", Icon: CalendarCheck, color: "text-primary" },
    { label: "Tomorrow", value: tomorrowCount, sub: "scheduled", Icon: CalendarClock, color: "text-blue-500" },
    { label: "This Month", value: monthCount, sub: "bookings", Icon: TrendingUp, color: "text-green-500" },
    { label: "All Time", value: totalCount, sub: "total clients", Icon: Users, color: "text-violet-500" },
  ];

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-glam-text">Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">{today}</p>
      </div>

      {/* Stats grid */}
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

      {/* Today's schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-base font-bold text-glam-text">Today&rsquo;s Schedule</h2>
          <Link href="/admin/orders"
            className="flex items-center gap-1 text-xs font-bold text-primary hover:text-secondary transition-colors duration-150 cursor-pointer">
            View All <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>
        {todayBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <CalendarCheck size={32} className="text-muted/30 mx-auto mb-3" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm text-muted">No appointments today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.map((b) => (
              <div key={b.id}
                className="bg-white rounded-2xl border border-border p-4 flex items-center gap-4 hover:border-primary/30 transition-colors duration-150">
                <span className="bg-pastel-pink text-primary font-bold text-sm rounded-xl px-3 py-1.5 shrink-0 flex items-center gap-1.5">
                  <Clock size={12} aria-hidden="true" />
                  {b.bookingTime}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-glam-text text-sm truncate">{b.clientName}</p>
                  <p className="text-xs text-muted">{b.serviceType}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly booking calendar */}
      <div>
        <h2 className="font-serif text-base font-bold text-glam-text mb-3">Monthly Overview</h2>
        <AdminCalendar dayCountMap={dayCountMap} today={today} />
      </div>

      {/* Recent bookings */}
      <div>
        <h2 className="font-serif text-base font-bold text-glam-text mb-3">Recently Added</h2>
        <div className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {recentBookings.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted">No bookings yet</div>
          ) : recentBookings.map((b) => (
            <div key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-pastel-pink/30 transition-colors duration-150">
              <div className="w-8 h-8 rounded-full bg-pastel-pink flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {b.clientName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-glam-text truncate">{b.clientName}</p>
                <p className="text-xs text-muted">{b.serviceType} · {b.bookingDate}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STATUS_COLORS[b.status] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SendScheduleBtn tomorrowDate={tomorrow} />
    </div>
  );
}
