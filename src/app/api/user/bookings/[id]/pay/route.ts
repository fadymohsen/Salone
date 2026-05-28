import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromCookie } from "@/lib/user-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { paymentMethod } = await request.json();

  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking || booking.userId !== userId)
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  if (booking.status !== "booked" || booking.paymentStatus === "paid")
    return NextResponse.json({ error: "This booking cannot be paid." }, { status: 400 });

  const pointsToAward = booking.amount ?? 0;

  const txns = [
    prisma.booking.update({
      where: { id },
      data: {
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: paymentMethod || "card",
      },
    }),
  ];

  // Award loyalty points: 1 EGP paid = 1 point
  if (pointsToAward > 0) {
    txns.push(
      prisma.user.update({ where: { id: userId }, data: { points: { increment: pointsToAward } } }) as never,
      prisma.pointsTransaction.create({
        data: { userId, points: pointsToAward, description: `Payment for ${booking.serviceType} (${pointsToAward} EGP)` },
      }) as never,
      prisma.booking.update({ where: { id }, data: { pointsEarned: pointsToAward } }) as never,
    );
  }

  await prisma.$transaction(txns);

  return NextResponse.json({ success: true, pointsEarned: pointsToAward });
}
