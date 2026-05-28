import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";


async function awardPointsIfCompleted(bookingId: string, previousStatus: string, newStatus: string) {
  if (previousStatus === "completed" || newStatus !== "completed") return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking?.userId) return;

  // 1 EGP = 1 point — award points based on the actual amount paid
  // If amount is null (not recorded), look up the service price as fallback
  // If amount is 0 (free via loyalty/promo), award 0 points
  let pointsToAward: number;
  if (booking.amount !== null) {
    pointsToAward = booking.amount;
  } else {
    const service = await prisma.service.findUnique({ where: { name: booking.serviceType } });
    pointsToAward = service?.price ?? 0;
  }

  if (pointsToAward <= 0) return;

  const config = await prisma.pointsConfig.findFirst();
  const threshold = config?.pointsThreshold ?? 100;
  const couponDiscount = config?.couponDiscount ?? 15;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { pointsEarned: pointsToAward } });

    const user = await tx.user.update({
      where: { id: booking.userId! },
      data: { points: { increment: pointsToAward } },
    });

    await tx.pointsTransaction.create({
      data: { userId: booking.userId!, points: pointsToAward, description: `Completed booking: ${booking.serviceType} (${pointsToAward} EGP)` },
    });

    // Points accumulate — user can choose to redeem for coupon from their dashboard
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  try {
    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        clientName: body.clientName,
        clientPhone: body.clientPhone,
        clientEmail: body.clientEmail || null,
        serviceType: body.serviceType,
        bookingDate: body.bookingDate,
        bookingTime: body.bookingTime,
        status: body.status,
        notes: body.notes || null,
        promoCode: body.promoCode || null,
      },
    });

    await awardPointsIfCompleted(id, existing.status, body.status);

    return NextResponse.json(booking);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
}
