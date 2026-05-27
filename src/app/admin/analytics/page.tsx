import { prisma } from "@/lib/db";
import { TrendingUp, Users, CalendarDays, CheckCircle2, XCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";

  let allBookings: { serviceType: string; status: string; bookingDate: string; clientPhone: string }[] = [];
  let monthCount = 0;

  try {
    [allBookings, monthCount] = await Promise.all([
      prisma.booking.findMany({
        select: { serviceType: true, status: true, bookingDate: true, clientPhone: true },
      }),
      prisma.booking.count({ where: { bookingDate: { gte: monthStart } } }),
    ]);
  } catch {
    // DB not available
  }

  // Service breakdown
  const serviceMap: Record<string, number> = {};
  for (const b of allBookings) {
    serviceMap[b.serviceType] = (serviceMap[b.serviceType] ?? 0) + 1;
  }
  const services = Object.entries(serviceMap).sort((a, b) => b[1] - a[1]);
  const maxService = services[0]?.[1] ?? 1;

  // Status breakdown
  const statusMap: Record<string, number> = {};
  for (const b of allBookings) {
    statusMap[b.status] = (statusMap[b.status] ?? 0) + 1;
  }

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0];
    return { date: d, label: d.slice(5), count: allBookings.filter((b) => b.bookingDate === d).length };
  });
  const maxDay = Math.max(...last7.map((d) => d.count), 1);

  // Unique clients
  const uniqueClients = new Set(allBookings.map((b) => b.clientPhone)).size;

  const STATUS_META: Record<string, { color: string; dot: string; Icon: React.ElementType }> = {
    confirmed: { color: "bg-blue-50 text-blue-600 border-blue-100", dot: "bg-blue-400", Icon: Clock },
    completed: { color: "bg-green-50 text-green-600 border-green-100", dot: "bg-green-400", Icon: CheckCircle2 },
    cancelled: { color: "bg-red-50 text-red-500 border-red-100", dot: "bg-red-300", Icon: XCircle },
  };

  const kpis = [
    { label: "Total Bookings", value: allBookings.length, Icon: CalendarDays },
    { label: "This Month", value: monthCount, Icon: TrendingUp },
    { label: "Unique Clients", value: uniqueClients, Icon: Users },
  ];

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-glam-text">Analytics</h1>
        <p className="text-sm text-muted mt-0.5">Overview of your salon performance</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpis.map(({ label, value, Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-pastel-pink flex items-center justify-center shrink-0">
              <Icon size={18} className="text-primary" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-primary">{value}</p>
              <p className="text-xs font-bold text-muted mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Last 7 days bar chart */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-serif text-sm font-bold text-glam-text mb-6">Bookings — Last 7 Days</h2>
        <div className="flex items-end gap-2 h-32">
          {last7.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150 min-h-[16px]">
                {d.count || ""}
              </span>
              <div className="w-full relative flex items-end" style={{ height: "88px" }}>
                <div
                  className="w-full bg-primary rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${(d.count / maxDay) * 88}px`,
                    minHeight: d.count ? "6px" : "2px",
                    opacity: d.count ? 1 : 0.12,
                  }}
                />
              </div>
              <span className="text-xs text-muted font-medium">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Service breakdown */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-serif text-sm font-bold text-glam-text mb-5">Top Services</h2>
        {services.length === 0 ? (
          <p className="text-sm text-muted">No data yet</p>
        ) : (
          <div className="space-y-4">
            {services.map(([service, count], i) => (
              <div key={service}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-bold text-glam-text flex items-center gap-1.5">
                    {i === 0 && <span className="text-primary text-xs font-black">#1</span>}
                    {service}
                  </span>
                  <span className="text-sm font-bold text-primary tabular-nums">{count}</span>
                </div>
                <div className="h-2 bg-pastel-pink rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${(count / maxService) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-serif text-sm font-bold text-glam-text mb-5">Booking Status</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusMap).map(([status, count]) => {
            const meta = STATUS_META[status];
            return (
              <div
                key={status}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${meta?.color ?? "bg-gray-50 text-gray-500 border-gray-100"}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${meta?.dot ?? "bg-gray-300"}`} aria-hidden="true" />
                <span className="text-sm font-bold capitalize">{status}</span>
                <span className="text-sm font-black ml-1">{count}</span>
              </div>
            );
          })}
          {Object.keys(statusMap).length === 0 && (
            <p className="text-sm text-muted">No data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
