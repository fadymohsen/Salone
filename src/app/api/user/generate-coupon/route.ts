import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromCookie } from "@/lib/user-auth";
import { randomBytes } from "node:crypto";

export async function POST() {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [user, config] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.pointsConfig.findFirst(),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const threshold = config?.pointsThreshold ?? 0;
    const couponDiscount = config?.couponDiscount ?? 15;

    if (threshold <= 0)
      return NextResponse.json({ error: "Auto-coupon is disabled" }, { status: 400 });

    if (user.points < threshold)
      return NextResponse.json({ error: "Not enough points", required: threshold, available: user.points }, { status: 400 });

    const code = `GLOW${randomBytes(3).toString("hex").toUpperCase()}`;

    await prisma.$transaction([
      prisma.promoCode.create({
        data: { code, discount: couponDiscount, isActive: true, maxUsage: 1, autoGen: true, userId },
      }),
      prisma.user.update({ where: { id: userId }, data: { points: { decrement: threshold } } }),
      prisma.pointsTransaction.create({
        data: { userId, points: -threshold, description: `Redeemed for coupon ${code} (${couponDiscount}% off)` },
      }),
    ]);

    return NextResponse.json({ success: true, code, discount: couponDiscount });
  } catch (error) {
    console.error("Generate coupon error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
