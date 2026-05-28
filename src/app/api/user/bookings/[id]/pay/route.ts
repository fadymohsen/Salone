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

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: "confirmed",
      paymentStatus: "paid",
      paymentMethod: paymentMethod || "card",
    },
  });

  return NextResponse.json(updated);
}
