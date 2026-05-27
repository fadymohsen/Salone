import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromCookie } from "@/lib/user-auth";

export async function POST(request: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { serviceId, bookingDate, bookingTime } = await request.json();

    if (!serviceId || !bookingDate || !bookingTime)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const [user, service] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!service || !service.pointsPrice)
      return NextResponse.json({ error: "Service not available for points redemption" }, { status: 400 });

    if (user.points < service.pointsPrice)
      return NextResponse.json({ error: "Not enough points", required: service.pointsPrice, available: user.points }, { status: 400 });

    // Deduct points, create transaction, and create booking in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { points: { decrement: service.pointsPrice } },
      }),
      prisma.pointsTransaction.create({
        data: {
          userId,
          points: -service.pointsPrice,
          description: `Redeemed for ${service.name}`,
        },
      }),
      prisma.booking.create({
        data: {
          userId,
          clientName: user.name,
          clientPhone: user.phone ?? "",
          clientEmail: user.email,
          serviceType: service.name,
          bookingDate,
          bookingTime,
          status: "confirmed",
          paymentMethod: "points",
          paymentStatus: "pending",
          amount: service.rewardDiscount ? service.price - service.pointsPrice : 0,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Redeem error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
