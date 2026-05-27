import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { randomBytes } from "node:crypto";

async function awardPointsIfCompleted(bookingId: string, previousStatus: string, newStatus: string) {
  if (previousStatus === "completed" || newStatus !== "completed") return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking?.userId) return;

  const config = await prisma.pointsConfig.findFirst();
  const pointsPerBooking = config?.pointsPerBooking ?? 10;
  const threshold = config?.pointsThreshold ?? 100;
  const couponDiscount = config?.couponDiscount ?? 15;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { pointsEarned: pointsPerBooking } });

    const user = await tx.user.update({
      where: { id: booking.userId! },
      data: { points: { increment: pointsPerBooking } },
    });

    await tx.pointsTransaction.create({
      data: { userId: booking.userId!, points: pointsPerBooking, description: `Completed booking: ${booking.serviceType}` },
    });

    // Auto-generate coupon if threshold reached
    if (user.points >= threshold) {
      const code = `GLOW${randomBytes(3).toString("hex").toUpperCase()}`;
      await tx.promoCode.create({
        data: { code, discount: couponDiscount, isActive: true, maxUsage: 1, autoGen: true, userId: booking.userId! },
      });
      await tx.user.update({ where: { id: booking.userId! }, data: { points: { decrement: threshold } } });
      await tx.pointsTransaction.create({
        data: { userId: booking.userId!, points: -threshold, description: `Redeemed for coupon ${code} (${couponDiscount}% off)` },
      });
    }
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
