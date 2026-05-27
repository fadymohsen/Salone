import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserIdFromCookie } from "@/lib/user-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, clientEmail, serviceType, bookingDate, bookingTime, promoCode } = body;

    if (!clientName || !clientPhone || !bookingDate || !bookingTime || !serviceType) {
      return NextResponse.json({ error: "Missing required properties" }, { status: 400 });
    }

    const userId = await getUserIdFromCookie();

    // Look up service price
    const service = await prisma.service.findUnique({ where: { name: serviceType } });
    let amount = service?.price ?? null;
    let appliedPromo: string | null = null;

    // Validate and apply promo code
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: promoCode.toUpperCase() } });
      if (promo && promo.isActive && (!promo.maxUsage || promo.usageCount < promo.maxUsage)) {
        if (amount) {
          if (promo.discountType === "fixed") {
            amount = Math.max(0, amount - promo.discount);
          } else {
            amount = Math.max(0, amount - Math.round(amount * promo.discount / 100));
          }
        }
        appliedPromo = promo.code;
        await prisma.promoCode.update({ where: { id: promo.id }, data: { usageCount: { increment: 1 } } });
      }
    }

    const savedBooking = await prisma.booking.create({
      data: {
        clientName,
        clientPhone,
        clientEmail: clientEmail || null,
        serviceType,
        bookingDate,
        bookingTime,
        userId: userId || null,
        promoCode: appliedPromo,
        amount,
      },
    });

    return NextResponse.json({ success: true, booking: savedBooking }, { status: 201 });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
