import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";

  const [allBookings, monthBookings, statusCounts] = await Promise.all([
    prisma.booking.findMany({ select: { serviceType: true, status: true, bookingDate: true, createdAt: true } }),
    prisma.booking.count({ where: { bookingDate: { gte: monthStart } } }),
    prisma.booking.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  // Service breakdown
  const serviceMap: Record<string, number> = {};
  for (const b of allBookings) {
    serviceMap[b.serviceType] = (serviceMap[b.serviceType] ?? 0) + 1;
  }
  const serviceBreakdown = Object.entries(serviceMap)
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);

  // Bookings per day for the last 7 days
  const last7: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
    const count = allBookings.filter((b) => b.bookingDate === d).length;
    last7.push({ date: d, count });
  }

  // Unique clients by phone
  const uniquePhones = new Set(
    await prisma.booking.findMany({ select: { clientPhone: true } }).then((r) => r.map((b) => b.clientPhone))
  );

  return NextResponse.json({
    total: allBookings.length,
    thisMonth: monthBookings,
    uniqueClients: uniquePhones.size,
    serviceBreakdown,
    last7Days: last7,
    statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count.id })),
  });
}
