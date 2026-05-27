import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromCookie } from "@/lib/user-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, clientEmail, serviceType, bookingDate, bookingTime } = body;

    if (!clientName || !clientPhone || !bookingDate || !bookingTime || !serviceType) {
      return NextResponse.json({ error: "Missing required properties" }, { status: 400 });
    }

    const userId = await getUserIdFromCookie();

    const savedBooking = await prisma.booking.create({
      data: {
        clientName,
        clientPhone,
        clientEmail: clientEmail || null,
        serviceType,
        bookingDate,
        bookingTime,
        userId: userId || null,
      },
    });

    return NextResponse.json({ success: true, booking: savedBooking }, { status: 201 });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
