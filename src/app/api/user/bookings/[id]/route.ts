import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromCookie } from "@/lib/user-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { bookingDate, bookingTime } = await request.json();

  if (!bookingDate || !bookingTime)
    return NextResponse.json({ error: "Date and time are required." }, { status: 400 });

  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking || booking.userId !== userId)
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  if (booking.status !== "confirmed")
    return NextResponse.json({ error: "Only confirmed bookings can be rescheduled." }, { status: 400 });

  const updated = await prisma.booking.update({
    where: { id },
    data: { bookingDate, bookingTime },
  });

  return NextResponse.json(updated);
}
