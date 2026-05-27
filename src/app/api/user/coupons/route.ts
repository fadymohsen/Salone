import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromCookie } from "@/lib/user-auth";

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [coupons, config] = await Promise.all([
    prisma.promoCode.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pointsConfig.findFirst(),
  ]);

  return NextResponse.json({
    coupons,
    threshold: config?.pointsThreshold ?? 100,
    pointsPerBooking: config?.pointsPerBooking ?? 10,
    couponDiscount: config?.couponDiscount ?? 15,
  });
}
