import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const promo = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });

    if (!promo || !promo.isActive)
      return NextResponse.json({ valid: false, error: "Invalid or expired promo code" });

    if (promo.maxUsage && promo.usageCount >= promo.maxUsage)
      return NextResponse.json({ valid: false, error: "Promo code usage limit reached" });

    return NextResponse.json({ valid: true, discount: promo.discount });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
