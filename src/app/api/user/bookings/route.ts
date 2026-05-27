import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromCookie } from "@/lib/user-auth";

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: [{ bookingDate: "desc" }, { bookingTime: "asc" }],
  });

  return NextResponse.json(bookings);
}
